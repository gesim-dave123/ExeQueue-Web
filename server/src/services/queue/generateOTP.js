import nodemailer from 'nodemailer';
const otpStore = new Map();

// ✅ Enhanced transporter with longer timeouts for slow connections
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_GMAIL,
    pass: process.env.GMAIL_PASSKEY,
  },
  pool: true, // Enable connection pooling
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 45000, // 45 seconds
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server ready');
  }
});

export const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// ✅ Enhanced with retry logic
export const sendCodeToEmail = async (email, code, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `📧 Attempt ${attempt}/${retries}: Sending OTP to ${email}...`
      );

      const info = await transporter.sendMail({
        from: `"ExeQueue System" <${process.env.ADMIN_GMAIL}>`,
        to: email,
        subject: 'Your Verification Code - ExeQueue',
        text: `Your verification code is: ${code}\n\nThis code expires in 1 minute.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1A73E8;">Verification Code</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #1A73E8; font-size: 32px; letter-spacing: 5px; background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px;">${code}</h1>
            <p style="color: #666;">This code expires in <strong>1 minute</strong>.</p>
            <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
        priority: 'high',
      });

      console.log(`✅ Email sent to ${email} (ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${retries} failed:`, error.message);

      if (attempt === retries) {
        console.error(`❌ All attempts failed for ${email}`);
        return false;
      }

      // Exponential backoff before retry
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  return false;
};

// Store OTP in memory
export const storeOTP = (email, code) => {
  otpStore.set(`otp_${email}`, {
    code: code,
    created_at: Date.now(),
    expires_at: Date.now() + 60000, // 1 minute
    is_used: false,
  });
  console.log(`💾 OTP stored for ${email}`);
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
  let cleanedCount = 0;
  for (let [key, value] of otpStore.entries()) {
    if (now > value.expires_at) {
      otpStore.delete(key);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired OTP(s)`);
  }
};

// Run cleanup every 1 minute
setInterval(() => {
  cleanupExpiredOTPs();
}, 60000);
