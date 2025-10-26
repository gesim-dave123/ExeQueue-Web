import React, { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sendOTPtoEmail } from "../../../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await sendOTPtoEmail( email );
    
    if (!res) {
      console.log("Email not found");
      setLoading(false);
      return;
    }

    navigate("/staff/verify-otp", { state: { email } });
    setLoading(false);
  };

  const handleResend = () => {
    handleSubmit(new Event('submit'));
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email Input */}
          <div className="relative mb-3">
            <label
              htmlFor="email"
              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                email
                  ? "-top-2.5 text-xs bg-white px-1 text-blue-500"
                  : "top-3 text-base text-gray-500"
              }`}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-[#DDEAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Send Code Button */}
          <button
            type="submit" //kani line i remove, for render rani sya
            disabled={loading || !email}
            className={`w-full font-semibold py-3 mb-5 rounded-2xl transition-all  ${
              loading || !email
                ? "bg-[#1A73E8] cursor-not-allowed text-white"
                : "bg-[#1A73E8] hover:bg-blue-700 text-white cursor-pointer"
            }`}
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </form>

        {/* Resend Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Didn't get any code?{" "}
            <button
              onClick={handleResend}
              className="text-[#1A73E8]  font-medium cursor-pointer"
            >
              Click to resend
            </button>
          </p>
        </div>

        {/* Back to Login */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={16} className="mr-2 text-gray-700" />
          <button
            onClick={() => navigate("/staff/login")}
            className="text-sm text-gray-700  cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}