import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/prisma.js";
import {
  deleteOTP,
  generateCode,
  getOTP,
  markOTPAsUsed,
  sendCodeToEmail,
  storeOTP,
} from "../services/queue/generateOTP.js";

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing!",
      });
    }

    const user = await prisma.sasStaff.findFirst({
      where: { username, isActive: true, deletedAt: null },
      select: {
        sasStaffId: true,
        hashedPassword: true,
        role: true,
        username: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found!",
      });
    }

    const decrypt = await bcrypt.compare(password, user.hashedPassword);
    if (!decrypt) {
      return res.status(403).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // Generate token *only after password is correct*
    const token = jwt.sign(
      { id: user.sasStaffId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // Clear old token only now
    res.clearCookie("access_token");

    // Set new token
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 12,
    });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        id: user.sasStaffId,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged Out Successfully!",
  });
};

// Force logout endpoint (clears cookie even if token is invalid)
export const forceLogout = (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Successfully logged out!",
  });
};

//Check login status endpoint
export const checkLoginStatus = (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(200).json({
        success: true,
        isLoggedIn: false,
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.status(200).json({
        success: true,
        isLoggedIn: true,
        user: {
          id: decoded.id,
          role: decoded.role,
        },
      });
    } catch (error) {
      // Token is invalid or expired
      return res.status(200).json({
        success: true,
        isLoggedIn: false,
      });
    }
  } catch (error) {
    console.error("Error checking login status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const requestPasswordReset = async (req, res) => {
  const correctEmail = (email) => {
    return email.endsWith("@gmail.com");
  };

  const { email } = req.body;

  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });

  if (!correctEmail(email))
    return res.status(400).json({
      success: false,
      message: "Invalid email format. Must be a valid Gmail address",
    });

  try {
    const user = await prisma.sasStaff.findFirst({
      where: {
        email: email,
        deletedAt: null,
        isActive: true,
      },
      select: { sasStaffId: true, email: true },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Email not found." });

    const OTPcode = generateCode();

    sendCodeToEmail(user.email, OTPcode)
      .then((success) => {
        if (success) {
          console.log(`OTP sent to ${email}`);
        } else {
          console.error(`Failed to send OTP to ${user.email}`);
          deleteOTP(user.email);
        }
      })
      .catch((error) => {
        console.error(`Error sending OTP to ${user.email}:`, error);
        deleteOTP(user.email);
      });

    storeOTP(user.email, OTPcode);

    const flowToken = jwt.sign(
      {
        email: user.email,
        purpose: "otp-flow",
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
      email: user.email,
      flowToken: flowToken,
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { receivedOTP, email, flowToken } = req.body;
  try {
    if (!receivedOTP)
      return res
        .status(400)
        .json({ success: false, message: "OTP is Required" });

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is Required" });
    if (!flowToken)
      return res.status(401).json({
        success: false,
        message: "Token required. Please try again.",
      });

    const decodedFlow = jwt.verify(flowToken, process.env.JWT_SECRET);
    if (decodedFlow.purpose !== "otp-flow" || decodedFlow.email !== email) {
      return res.status(401).json({
        success: false,
        message: "Invalid or mismatched token.",
      });
    }

    const OTPcode = getOTP(email);

    if (!OTPcode)
      return res.status(404).json({
        success: false,
        message: "OTP has expired. Please try again",
      });

    if (Date.now() > OTPcode.expires_at) {
      deleteOTP(email);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new code",
      });
    }

    if (receivedOTP !== OTPcode.code) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again",
      });
    }

    if (OTPcode.is_used)
      return res
        .status(400)
        .json({ success: false, message: "OTP has already been used" });

    markOTPAsUsed(email);
    deleteOTP(email);

    const resetToken = jwt.sign(
      { email, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Verify email error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "The password reset session has expired. Please restart.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authorization token provided",
      });
    }
    const resetToken = authHeader.split(" ")[1];
    console.log("Token extracted:", resetToken.substring(0, 20) + "...");

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Reset token has expired. Please request a new one.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(401).json({
        success: false,
        message: "Invalid token purpose",
      });
    }

    const { email } = decoded;

    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Your password must be 8 characters long",
      });
    }

    const user = await prisma.sasStaff.findFirst({
      where: {
        email: email,
        deletedAt: null,
        isActive: true,
      },
      select: {
        sasStaffId: true,
        email: true,
        hashedPassword: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.hashedPassword
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your old password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.sasStaff.update({
      where: { sasStaffId: user.sasStaffId }, // ✅ Use sasStaffId for update
      data: {
        hashedPassword: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Internal Server Error, An error occurred while resetting password",
      error: error.message,
    });
  }
};

export const verifyUser = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        user: null,
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};
