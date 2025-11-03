import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../../api/auth";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;

  // useEffect(() => {
  //   inputRefs[0].current?.focus();
  // }, [otp]);

  // useEffect(() => {
  //   if (email === undefined || resetToken === undefined) return; 
  //   if (!email || !resetToken) {
  //     navigate("/staff/forgot-password", { replace: true });
  //   }
  // }, [email, resetToken, navigate]);

    const handleChange = (e) => {
    const { name, value } = e.target;
    
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    
    setFormData(updatedFormData);
    
    let newErrors = { ...errors, [name]: "" }; 
    
    if (updatedFormData.newPassword && updatedFormData.confirmPassword) {
      if (updatedFormData.newPassword !== updatedFormData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        newErrors.confirmPassword = "";  
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({
        ...errors,
        confirmPassword: "Passwords do not match",
      });
      return;
    }
    if (formData.newPassword.length < 8) {
      setErrors({
        ...errors,
        newPassword: "Password must be at least 8 characters",
      });
      return;
    }
    console.log("Reset Token:", resetToken);

    setLoading(true);
    const res = await resetPassword(
      resetToken,                    
      formData.newPassword           
    );
    
    if (!res?.success) {
      setErrors({
        ...errors,
        newPassword: res?.message || "Failed to reset password",
      });
      setLoading(false);
      return;
    }   
    navigate("/staff/success-reset", { state: { message: "Password reset successfully!" } });
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-transparent p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-white border border-[#E2E3E4] rounded-xl flex items-center justify-center">
            <img src="/assets/Lock.png" alt="" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl text-gray-900 font-semibold text-center mb-2">
          Set a new password
        </h2>
        <p className="text-gray-600 text-center px-10 mb-8 text-sm">
          Your new password must be different from previously used passwords
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col text-left gap-5">
          {/* New Password Input */}
          <div className="relative">
            <label
              htmlFor="newPassword"
              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                formData.newPassword
                  ? "-top-2.5 text-xs bg-white px-1"
                  : "top-3 text-base text-gray-500"
              } ${
                errors.newPassword
                  ? "text-red-500"
                  : formData.newPassword
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all pr-12 ${
                errors.newPassword
                  ? "border-red-500 focus:ring-2 focus:ring-red-500"
                  : "border-[#DDEAFC] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
            {formData.newPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <label
              htmlFor="confirmPassword"
              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                formData.confirmPassword
                  ? "-top-2.5 text-xs bg-white px-1"
                  : "top-3 text-base text-gray-500"
              } ${
                errors.confirmPassword
                  ? "text-red-500"
                  : formData.confirmPassword
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              Confirm New Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all pr-12 ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-2 focus:ring-red-500"
                  : "border-[#DDEAFC] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
            {formData.confirmPassword && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-6 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Reset Button */}
          <button
            type="submit"
            disabled={loading || !formData.newPassword || !formData.confirmPassword}
            className={`w-full font-semibold py-3 rounded-xl transition-all  ${
              loading || !formData.newPassword || !formData.confirmPassword
                ? "bg-[#1A73E8] cursor-not-allowed text-white"
                : "bg-[#1A73E8] hover:bg-blue-700 text-white cursor-pointer"
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

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