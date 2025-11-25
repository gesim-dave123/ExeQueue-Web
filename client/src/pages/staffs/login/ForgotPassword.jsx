import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOTPtoEmail } from "../../../api/auth";
import { showToast } from "../../../components/toast/ShowToast.jsx";
import { useFlow } from "../../../context/FlowProvider";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmptyError, setIsEmptyError] = useState(false);
  const [isInvalidEmail, setIsInvalidEmail] = useState(false);
  const [isNotGmail, setIsNotGmail] = useState(false); // New state for non-gmail emails
  const [error, setError] = useState("");
  const [isEmailFound, setIsEmailFound] = useState(true);
  const [reSendCode, setReSendCode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { startFlow, clearFlow } = useFlow();
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Gmail validation function
  const validateGmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsEmptyError(false);
    setIsInvalidEmail(false);
    setIsNotGmail(false);

    if (!email.trim()) {
      setIsEmptyError(true);
      setLoading(false);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setIsInvalidEmail(true);
      setLoading(false);
      return;
    }

    // Validate Gmail domain
    if (!validateGmail(email)) {
      setIsNotGmail(true);
      setLoading(false);
      return;
    }

    try {
      const res = await sendOTPtoEmail(email);
      if (res?.success) {
        showToast(res?.message, "success");
        const userEmail = res?.email || email;
        startFlow(userEmail, res?.flowToken);
        setIsEmailFound(true);
        navigate("/staff/verify-otp", { state: { userEmail } });
        setReSendCode(true);
      } else {
        // showToast("Email not found", "error");
        return;
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setIsEmailFound(false);
    }
  };

  const handleResend = () => {
    if (!email.trim()) {
      setIsEmptyError(true);
      return;
    }

    if (!validateEmail(email)) {
      setIsInvalidEmail(true);
      return;
    }

    if (!validateGmail(email)) {
      setIsNotGmail(true);
      return;
    }

    // If valid, submit again
    handleSubmit(new Event("submit"));
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-transparent p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-white border  border-[#E2E3E4] rounded-xl flex items-center justify-center">
            <img src="/assets/Lock.png" alt="" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl text-gray-900 font-semibold text-center mb-2">
          Forgot Password
        </h2>
        <p className="text-gray-600 text-center mb-8 text-sm px-4">
          Enter your email address and we'll send you the OTP code.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Email Input */}
          <div className="relative mb-3">
            <label
              htmlFor="email"
              className={`absolute left-5 transition-all duration-200 pointer-events-none
      ${
        (isEmptyError || isInvalidEmail || isNotGmail) && !isFocused
          ? "text-red-500"
          : "text-[#1A73E8]"
      }
      ${
        (isEmptyError || isInvalidEmail || isNotGmail) && !isFocused
          ? "-top-2.5 text-xs bg-white px-1 text-red-500"
          : ""
      }
      ${
        email ||
        isFocused ||
        ((isEmptyError || isInvalidEmail || isNotGmail) && isFocused)
          ? "-top-2.5 text-xs bg-white px-1 text-blue-500 "
          : "top-3.5 text-base text-gray-500 "
      }`}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onFocus={() => {
                setIsFocused(true);
                setIsEmailFound(true);
                setIsNotGmail(false);
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setIsEmptyError(false);
                setIsInvalidEmail(false);
                setIsNotGmail(false);
              }}
              className={`w-full px-3 py-3 rounded-xl focus:outline-none transition-all 
      ${
        isFocused
          ? "border-[#1A73E8] border-2"
          : isEmptyError || isInvalidEmail || isNotGmail
          ? "border-red-500 border-2"
          : !email
          ? "border-[#DDEAFC] border-2"
          : "border-[#1A73E8] border-2"
      }
    `}
            />
            {/* Always reserve space for error message */}
            <div className="h-5 mt-1">
              {isEmptyError && !isFocused && (
                <p className="text-red-500 text-left text-xs">
                  Email is required
                </p>
              )}
              {isInvalidEmail && !isFocused && !isEmptyError && (
                <p className="text-red-500 text-left text-xs">
                  Please enter a valid email address
                </p>
              )}
              {isNotGmail && !isFocused && !isEmptyError && !isInvalidEmail && (
                <p className="text-red-500 text-left text-xs">
                  Please enter a valid email address
                </p>
              )}
            </div>
          </div>
          {/* Send Code Button */}
          <button
            type="submit"
            disabled={loading || !email}
            className={`w-full font-medium py-3 mb-5 rounded-2xl transition-all  ${
              loading || !email
                ? "bg-[#1A73E8]/40 cursor-not-allowed text-white"
                : "bg-[#1A73E8] hover:bg-[#1557B0] text-white cursor-pointer"
            }`}
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </form>

        {reSendCode && !isEmptyError && !isInvalidEmail && !isNotGmail && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Didn't get any code?{" "}
              <button
                onClick={handleResend}
                className="text-[#1A73E8] font-medium cursor-pointer"
              >
                Click to resend
              </button>
            </p>
          </div>
        )}

        {/* Back to Login */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={16} className="mr-2 text-gray-700" />
          <button
            onClick={() => {
              clearFlow();
              navigate("/staff/login");
            }}
            className="text-sm text-gray-700 cursor-pointer hover:font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
