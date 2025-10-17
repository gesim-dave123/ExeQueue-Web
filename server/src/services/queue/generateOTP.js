
import nodemailer from 'nodemailer';
const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_GMAIL,
    pass: process.env.GMAIL_PASSKEY 
  }
});
   

export const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};


export const sendCodeToEmail = async (email,adminEmail, code) => {
  try {
   
    await transporter.sendMail({
      from: adminEmail,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}\n\nThis code expires in 1 minute.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <h2>Verification Code</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>This code expires in 1 minute.</p>
        <p><small>If you did not request this, please ignore this email.</small></p>
      `
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Store OTP in memory
export const storeOTP = (email, code) => {
  otpStore.set(`otp_${email}`, {
    code: code,
    created_at: Date.now(),
    expires_at: Date.now() + 120000,  // 1 minute
    is_used: false
  });
};

// Get OTP from memory
export const getOTP = (email) => {
  return otpStore.get(`otp_${email}`);
};

// Mark OTP as used
export const markOTPAsUsed = (email) => {
  const otpRecord = otpStore.get(`otp_${email}`);
  if (otpRecord) {
    otpRecord.is_used = true;
    otpStore.set(`otp_${email}`, otpRecord);
  }
};

// Delete OTP from memory
export const deleteOTP = (email) => {
  otpStore.delete(`otp_${email}`);
};

// Cleanup expired OTPs
export const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (let [key, value] of otpStore.entries()) {
    if (now > value.expires_at) {
      otpStore.delete(key);
    }
  }
};





