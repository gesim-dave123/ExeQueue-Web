import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/prisma.js';

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  console.log('Hereee');
  try {
    if (!username || !password)
      return res
        .status(403)
        .json({ success: false, message: 'Required Fields are missing!' });

    const user = await prisma.sasStaff.findUnique({
      where: {
        username: username,
      },
      select: {
        sasStaffId: true,
        hashedPassword: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'Account not found!' });

    // ✅ Check if account is inactive or deleted
    if (!user.isActive || user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const decrypt = await bcrypt.compare(password, user.hashedPassword);
    if (!decrypt)
      return res
        .status(403)
        .json({ success: false, message: 'Invalid Credentials' });

    const token = await jwt.sign(
      {
        id: user.sasStaffId,
        role: user.role,
        isActive: user.isActive,
      },
      process.env.JWT_SECRET,
      { expiresIn: user.role === Role.PERSONNEL ? '10h' : '5h' }
    );

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge:
        user.role === Role.PERSONNEL
          ? 1000 * 60 * 60 * 20
          : 1000 * 60 * 60 * 10,
    });

    return res.status(200).json({
      success: true,
      message: 'Logged In Successfully!',
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error('Error in Login: ', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error!' });
  }
};

export const createUser = (req, res) => {
  const {
    username,
    password,
    first_name,
    last_name,
    middle_name,
    email,
    role,
  } = req.body;

  try {
    if (
      !username?.trim() ||
      !password?.trim() ||
      !email?.trim() ||
      !role?.trim()
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Required fields are missing!' });
    }
    if (!first_name?.trim() || !last_name?.trim())
      return res.status(403).json({});
    // TODO: Continue this part, it should validate all fields
  } catch (error) {}
};

export const logoutUser = (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged Out Successfully!',
  });
};

export const requestPasswordReset = async (req, res) => {
  const correctEmail = (email) => {
    return email.endsWith('@gmail.com');
  };

  const { email } = req.body;

  if (!email)
    return res
      .status(400)
      .json({ success: false, message: 'Email is required' });

  if (!correctEmail(email))
    return res.status(400).json({
      success: false,
      message: 'Invalid email format. Must be a Gmail address',
    });

  try {
    const user = await prisma.sasStaff.findUnique({
      where: { email: email },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'Email not found in database' });

    const OTPcode = generateCode();
    storeOTP(email, OTPcode);

    // ✅ Send email asynchronously (no admin email query needed)
    sendCodeToEmail(email, OTPcode)
      .then((success) => {
        if (success) {
          console.log(`✅ OTP sent to ${email}`);
        } else {
          console.error(`❌ Failed to send OTP to ${email}`);
          deleteOTP(email); // Clean up if email fails
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending OTP to ${email}:`, error);
        deleteOTP(email);
      });

    // ✅ Respond immediately to user
    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { receivedOTP, email } = req.body;
    if (!receivedOTP)
      return res
        .status(400)
        .json({ success: false, message: 'Code is Required' });

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: 'Email is Required' });

    const OTPcode = getOTP(email);

    if (!OTPcode)
      return res.status(404).json({
        success: false,
        message: 'OTP not found or has expired. Please try again',
      });

    if (Date.now() > OTPcode.expires_at) {
      deleteOTP(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code',
      });
    }

    if (receivedOTP !== OTPcode.code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again',
      });
    }

    if (OTPcode.is_used)
      return res
        .status(400)
        .json({ success: false, message: 'OTP has already been used' });

    markOTPAsUsed(email);
    deleteOTP(email);

    const resetToken = jwt.sign(
      { email, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      resetToken,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const authHeader = req.headers.authorization;

    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const resetToken = authHeader.split(' ')[1];
    console.log('Token extracted:', resetToken.substring(0, 20) + '...');

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Reset token has expired. Please request a new one.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid reset token',
      });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token purpose',
      });
    }

    const { email } = decoded;

    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Your password must be 8 characters long',
      });
    }

    // Check if user exists
    const user = await prisma.sasStaff.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // ✅ NEW: Check if new password is the same as old password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.hashedPassword
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your old password',
      });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.sasStaff.update({
      where: { email: email },
      data: {
        hashedPassword: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password',
      error: error.message,
    });
  }
};
export const verifyUser = (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error('Error in verifying user: ', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error!' });
  }
};
