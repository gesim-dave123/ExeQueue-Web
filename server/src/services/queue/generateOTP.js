import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const otpStore = new Map();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Enhanced transporter with longer timeouts for slow connections
const transporter = nodemailer.createTransport({
  service: "gmail",
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
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ Email transporter error:", error);
//   } else {
//     console.log("✅ Email server ready");
//   }
// });
setTimeout(async () => {
  try {
    await transporter.verify();
    console.log("✅ Email server ready");
  } catch (err) {
    console.warn("⚠️ Email server unavailable (offline?)");
  }
}, 3000);

export const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Enhanced with retry logic and PNG CID attachment
export const sendCodeToEmail = async (email, code, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `📧 Attempt ${attempt}/${retries}: Sending OTP to ${email}...`
      );

      // Read PNG file and convert to base64 for attachment
      let logoAttachment = null;
      try {
        // Try to read the logo file from your project
        const logoPath = path.join(__dirname, "../queue/Logo.png");
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoAttachment = {
            filename: "Logo.png",
            content: logoBuffer,
            encoding: "base64",
            cid: "exequeue-logo", // same cid value as in the img src
          };
          console.log("✅ Logo file found and attached");
        } else {
          console.log("⚠️ Logo file not found, using text-based header");
        }
      } catch (error) {
        console.log("⚠️ Could not load logo file:", error.message);
      }

      const mailOptions = {
        from: `"ExeQueue System" <${process.env.ADMIN_GMAIL}>`,
        to: email,
        subject: "Your Verification Code - ExeQueue",
        text: `Your verification code is: ${code}\n\nThis code expires in 1 minute.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @keyframes blob {
                0%, 100% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
              }
              .blob-1 {
                animation: blob 7s infinite;
              }
              .blob-2 {
                animation: blob 7s infinite 2s;
              }
              .blob-3 {
                animation: blob 7s infinite 4s;
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px; position: relative;">
              <tr>
                <td align="center" style="position: relative;">
                  <!-- Animated background blobs -->
                  
                  
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); border: 1px solid rgba(26, 115, 232, 0.08); position: relative; z-index: 10;">
                    
                    <!-- Header with Logo -->
                    <tr>
                      <td align="center" style="padding: 60px 40px 50px 40px; background: linear-gradient(135deg, rgba(26, 115, 232, 0.03) 0%, rgba(252, 211, 77, 0.03) 100%);">
                        ${
                          logoAttachment
                            ? `<img src="cid:exequeue-logo" alt="ExeQueue Logo" style="width: 80px; height: 75px; display: block; margin: 0 auto 20px auto;" />`
                            : `<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #1A73E8 0%, #0d47a1 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; box-shadow: 0 8px 24px rgba(26, 115, 232, 0.3);">
                            <span style="color: #ffffff; font-size: 36px; font-weight: 700;">E</span>
                          </div>`
                        }
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: black; letter-spacing: -0.5px;">ExeQueue</h1>
                      </td>
                    </tr>
                    
                    <!-- Verification Code Section -->
                    <tr>
                      <td align="center" style="padding: 50px 40px;">
                        <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #111827;">Verification Code</h2>
                        <p style="margin: 0 0 32px 0; font-size: 15px; color: #6B7280; line-height: 1.6;">
                          Enter this code to verify your account
                        </p>
                        
                        <!-- OTP Code Display with modern gradient card -->
                        <div style="background: linear-gradient(135deg, rgba(26, 115, 232, 0.05) 0%, rgba(252, 211, 77, 0.05) 100%); border-radius: 16px; padding: 40px; margin: 0 0 32px 0; border: 2px solid rgba(26, 115, 232, 0.1); position: relative; overflow: hidden;">
                          <!-- Subtle animated background -->
                         
                          
                          <div style="font-size: 56px; font-weight: 700; color: #1A73E8; letter-spacing: 16px; text-align: center; font-family: 'SF Mono', 'Monaco', 'Courier New', monospace; position: relative; z-index: 1;">
                            ${code}
                          </div>
                        </div>
                        
                        <!-- Info box -->
                        <div style="background-color: #F8F9FA; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                          <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                             This code expires in <strong>1 minute</strong>
                          </p>
                        </div>
                        
                        <p style="margin: 0; font-size: 14px; color: #9CA3AF; line-height: 1.6; text-align: center;">
                          If you didn't request this code, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background: linear-gradient(135deg, rgba(26, 115, 232, 0.02) 0%, rgba(252, 211, 77, 0.02) 100%); padding: 32px 40px; border-top: 1px solid rgba(26, 115, 232, 0.08);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9CA3AF; line-height: 1.6;">
                                © ${new Date().getFullYear()} ExeQueue. All rights reserved.
                              </p>
                              <p style="margin: 0; font-size: 12px; color: #D1D5DB;">
                                Secure code execution platform
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        priority: "high",
      };

      // Add attachment if logo exists
      if (logoAttachment) {
        mailOptions.attachments = [logoAttachment];
      }

      const info = await transporter.sendMail(mailOptions);

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
