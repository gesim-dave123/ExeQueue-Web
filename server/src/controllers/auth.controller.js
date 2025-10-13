
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {generateCode,sendCodeToEmail,storeOTP,getOTP,markOTPAsUsed,deleteOTP} from '../services/queue/generateOTP.js'
import prisma from '../../prisma/prisma.js'

export const loginUser = async (req, res) =>{
  const {username, password} = req.body
  console.log("Hereee")
  try {
    if(!username || !password) return res.status(403).json({success: false, message: "Required Fields are missing!"})
    const user = await prisma.sasStaff.findUnique({
      where:{
        username: username
      },
      select:{
        sasStaffId: true,
        hashedPassword: true,
        role: true,
        isActive: true,
        serviceWindowId: true
      }
    })

    if(!user) return res.status(404).json({success: false, message: "Account not found!"})
    
    const decrypt = await bcrypt.compare(password, user.hashedPassword)
    if(!decrypt) return res.status(403).json({success: false, message: 'Invalid Credentials'})
    
    const token = await jwt.sign({
      id: user.sasStaffId,
      role: user.role,
      isActive: user.isActive,
      serviceWindowId: user.serviceWindowId

    }, process.env.JWT_SECRET,
    {expiresIn: user.role === Role.PERSONNEL ? '10h': '5h'}
   );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",
    maxAge: user.role === Role.PERSONNEL ? 1000 * 60 * 60 * 10 : 1000 * 60 * 60 * 5,
  });

   return res.status(200).json({
    success: true,
    message: "Logged In Successfully!",
    role: user.role,
    serviceWindowId: user.serviceWindowId,
    token: token
   })

  } catch (error) {
    console.error('Error in Login: ', error)
    return res.status(500).json({sucess: false, message: "Internal Server Error!"})
  }
}

export const createUser = (req,res)=>{
  const {
    username,
    password,
    first_name,
    last_name,
    middle_name,
    email,
    role,
  } = req.body

  try {
    if(!username?.trim() || !password?.trim()|| !email?.trim() || !role?.trim()){
      return res.status(403).json({success: false, message: "Required fields are missing!"})
    }
    if(!first_name?.trim() || !last_name?.trim()) return res.status(403).json({})
   
  } catch (error) {
    
  }
}

export const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "strict"
  });

  return res.status(200).json({
    success:true,
    message: "Logged Out Successfully!"
  })
};


export const requestPasswordReset = async (req, res) => {
  const correctEmail = (email) => {
    return email.endsWith("@gmail.com");
  };

  const { email } = req.body;

  if (!email) return res.status(400).json({success: false, message: "Email is required"});
  
  if (!correctEmail(email)) return res.status(400).json({success: false,message: "Invalid email format. Must be a Gmail address"});
  
  try {
    const user = await prisma.sasStaff.findUnique({
      where: {
        email: email
      }
    });

    if (!user) return res.status(404).json({ success: false, message: "Email not found in database"});
    
    const OTPcode = generateCode();
    storeOTP(email,OTPcode);
    const adminEmail = await prisma.sasStaff.findUnique({
      where:{
        username: "admin2"
      },
      select:{
        email:true
      }
    })
    
    const emailSent = await sendCodeToEmail(email,adminEmail, OTPcode);

    if (!emailSent) return res.status(500).json({ success: false,message: "Failed to send verification email"});
    
    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully", 
    });

  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { recievedOTP, email } = req.body;
    if (!recievedOTP) return res.status(400).json({ success: false, message: "Code is Required"});
    
    if (!email) return res.status(400).json({success: false, message: "Email is Required"});

    const OTPcode = getOTP(email);

    if (!OTPcode) return res.status(404).json({success: false,message: "OTP not found or has expired. Please try again"});
    
    if (Date.now() > OTPcode.expires_at) {
      deleteOTP(email);
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new code"});
    }

    if (recievedOTP !== OTPcode.code) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again"
      });
    }

    if (OTPcode.is_used) return res.status(400).json({success: false,message: "OTP has already been used"});
    
    markOTPAsUsed(email);
    deleteOTP(email);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later"
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword, email } = req.body;

    if (!newPassword || !confirmPassword || !email) {
      return res.status(400).json({
        success: false,
        message: "Email and passwords are required",
      });
    }


    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match",
      });
    }

    const user = await prisma.sasStaff.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found in database",
      });
    }
  
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.sasStaff.update({
      where: { email },
      data: {
        hashedPassword: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting password",
    });
  }
};
  



