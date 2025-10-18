import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
// import { verifyOTP } from "../../api/auth";

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "ian****@example.com";

  // Mask email for display
  const maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1****$2");

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length !== 4) return;

    setLoading(true);
    const res = await verifyOTP({ email, code: otpCode });
    
    if (!res?.success) {
      setLoading(false);
      // Handle error
      return;
    }

    // Navigate to reset password
    navigate("/reset-password", { state: { email, code: otpCode } });
    setLoading(false);
  };

  const handleResend = () => {
    // Trigger resend logic
    setOtp(["", "", "", ""]);
    inputRefs[0].current?.focus();
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-transparent p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg">
        {/* Mail Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-white border border-[#E2E3E4] rounded-xl flex items-center justify-center">
            <img src="/assets/Email.png" alt="" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl text-[#202124] font-bold text-center mb-2">
          Check your Email
        </h2>
        <p className="text-gray-600 text-center mb-8 text-sm">
          Input the code that was sent to <br />
          <span className="font-medium">{maskedEmail}</span>
        </p>

        {/* OTP Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex justify-center gap-3 mb-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-16 h-16 text-center text-[#1A73E8] text-2xl font-bold border-2  border-[#1A73E8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            ))}
          </div>

          {/* Resend Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-[#1A73E8]  font-medium cursor-pointer"
            >
              Send Code
            </button>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 4}
            className={`w-full font-semibold py-3 rounded-xl transition-all cursor-pointer ${
              loading || otp.join("").length !== 4
                ? "bg-[#1A73E8] cursor-not-allowed text-white"
                : "bg-[#1A73E8] hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={16} className="mr-2 text-[#202124]" />
          <button
            onClick={() => navigate("/staff/login")}
            className="text-sm text-[#202124]  cursor-pointer font-medium "
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
