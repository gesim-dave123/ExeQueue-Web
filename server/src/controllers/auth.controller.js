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
      return res.status(403).json({
        success: false,
        message: "Required fields are missing!",
      });
    }

    const existingToken = req.cookies.access_token;

    if (existingToken) {
      try {
        const decoded = jwt.verify(existingToken, process.env.JWT_SECRET);

        const userAlreadyLoggedIn = await prisma.sasStaff.findFirst({
          where: { username: username, deletedAt: null },
          select: { sasStaffId: true, isActive: true },
        });

        if (!userAlreadyLoggedIn) {
          return res.status(404).json({
            success: false,
            message: "Account not found!",
          });
        }

        if (!userAlreadyLoggedIn.isActive) {
          return res.status(401).json({
            success: false,
            message: "Account is not active.",
          });
        }

        if (
          userAlreadyLoggedIn &&
          decoded.id === userAlreadyLoggedIn.sasStaffId
        ) {
          return res.status(200).json({
            success: true,
            message: "You are already logged in.",
            alreadyLoggedIn: true,
            sameAccount: true,
          });
        }

        // Different user trying to login → BLOCK
        return res.status(400).json({
          success: false,
          message: "Another account is already logged in. Please logout first.",
          alreadyLoggedIn: true,
          sameAccount: false,
        });
      } catch (err) {
        console.log("Existing token invalid → continue login");
      }
    }
    const user = await prisma.sasStaff.findFirst({
      where: {
        username: username,
        deletedAt: null,
      },
      select: {
        sasStaffId: true,
        hashedPassword: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found!",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is not active.",
      });
    }

    const decrypt = await bcrypt.compare(password, user.hashedPassword);

    if (!decrypt) {
      return res.status(403).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const token = jwt.sign(
      {
        id: user.sasStaffId,
        role: user.role,
        isActive: user.isActive,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 12,
    });

    return res.status(200).json({
      success: true,
      message: "Logged In Successfully!",
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Error in Login:", error);
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

// ✅ NEW: Force logout endpoint (clears cookie even if token is invalid)
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

// ✅ NEW: Check login status endpoint
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
      message: "Invalid email format. Must be a Gmail address",
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
        .json({ success: false, message: "Email not found in database" });

    const OTPcode = generateCode();

    sendCodeToEmail(user.email, OTPcode)
      .then((success) => {
        if (success) {
          console.log(`✅ OTP sent to ${email}`);
        } else {
          console.error(`❌ Failed to send OTP to ${user.email}`);
          deleteOTP(user.email); // Clean up if email fails
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending OTP to ${user.email}:`, error);
        deleteOTP(user.email);
      });

    storeOTP(user.email, OTPcode);

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
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
  try {
    const { receivedOTP, email } = req.body;
    if (!receivedOTP)
      return res
        .status(400)
        .json({ success: false, message: "Code is Required" });

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is Required" });

    const OTPcode = getOTP(email);

    if (!OTPcode)
      return res.status(404).json({
        success: false,
        message: "OTP not found or has expired. Please try again",
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
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error("Error in verifying user: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
};
