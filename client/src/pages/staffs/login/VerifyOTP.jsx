import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendOTPtoEmail, verifyOTP } from "../../../api/auth";
import { showToast } from "../../../components/toast/ShowToast";
import { useFlow } from "../../../context/FlowProvider";

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const { flowToken, flowEmail, clearFlow } = useFlow();
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const [isOtpCorrect, setOtpCorrect] = useState(true);
  const [shake, setShake] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  // const email = location.state?.email;

  // useEffect(() => {
  //   if (!email) {
  //     navigate("/staff/login", { replace: true });
  //   }
  // }, [email, navigate]);

  useEffect(() => {
    // If either the email or the flow token is missing, the flow is invalid.
    if (!flowEmail || !flowToken) {
      clearFlow(); // Clear any partial data
      navigate("/staff/login", { replace: true });
    }
  }, [flowEmail, flowToken, navigate, clearFlow]);

  const email = flowEmail;

  // Focus first input on mount
  useEffect(() => {
    if (email) {
      inputRefs[0].current?.focus();
    }
  }, [email]);

  // Don't render if no email
  if (!flowEmail || !flowToken) {
    return null;
  }
  // Mask email for display
  const maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1****$2");

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 4) return;

    setLoading(true);
    const res = await verifyOTP(otpCode, flowToken, email);

    if (!res?.success) {
      setLoading(false);
      setOtpCorrect(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setOtpCorrect(true);
    navigate("/staff/reset-password", {
      state: { resetToken: res.resetToken, email },
    });
    console.log(res.resetToken);
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setOtp(["", "", "", ""]);
    inputRefs[0].current?.focus();
    setResendCountdown(30);

    try {
      const res = await sendOTPtoEmail(email);
      if (res?.success) {
        showToast("A new OTP has been sent to your email!", "success");
      } else {
        showToast(res?.message || "Failed to resend OTP.", "error");
      }
    } catch (error) {
      showToast("An unexpected error occurred.", "error");
    }
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
          <div
            className={`flex justify-center gap-3 mb-2 ${
              shake ? "animate-shake" : ""
            }`}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => setOtpCorrect(true)}
                className={`w-16 h-16 text-center text-2xl font-bold border-2 rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                  !isOtpCorrect
                    ? "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500"
                    : "border-[#1A73E8] text-[#1A73E8] focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
            ))}
          </div>

          {/* Resend Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't get any code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCountdown > 0}
                className={`font-medium ${
                  resendCountdown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#1A73E8] cursor-pointer hover:underline"
                }`}
              >
                Click to resend
                {resendCountdown > 0 && ` (${resendCountdown}s)`}
              </button>
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 4}
            className={`w-full font-semibold py-3 rounded-xl transition-all  ${
              loading || otp.join("").length !== 4
                ? "bg-[#1A73E8]/40 cursor-not-allowed text-white"
                : "bg-[#1A73E8] hover:bg-[#1557B0] text-white cursor-pointer"
            }`}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={16} className="mr-2 text-[#202124]" />
          <button
            onClick={() => {
              clearFlow();
              navigate("/staff/login");
            }}
            className="text-sm text-[#202124]  cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>

      {/* Shake animation styles */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
