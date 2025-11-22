import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../../api/auth";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNPasswordFocused, setIsNPasswordFocused] = useState(false);
  const [isCPasswordFocused, setIsCPasswordFocused] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    
    setFormData(updatedFormData);
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({
      newPassword: "",
      confirmPassword: "",
    });

    // Validate on submit only
    if (formData.newPassword.length < 8) {
      setErrors({
        ...errors,
        newPassword: "Password must be at least 8 characters",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({
        ...errors,
        confirmPassword: "Passwords do not match",
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
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-5">
            {/* New Password Input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                onFocus={() => setIsNPasswordFocused(true)}
                onBlur={() => setIsNPasswordFocused(false)}
                placeholder=" "
                className={`peer w-full px-4 py-3 pr-12 border rounded-2xl bg-white 
                  focus:outline-none transition-all
                  ${
                    errors.newPassword
                      ? "border-red-500 border-1 focus:ring-red-500"
                      : "border-[#DDEAFC] focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  }`}
              />
              <label
                htmlFor="newPassword"
                className={`absolute left-5 transition-all duration-200 bg-white px-1 pointer-events-none 
                  text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs 
                  -top-2.5 text-xs 
                  ${
                    formData.newPassword ? "hidden peer-focus:flex" : ""
                  }
                  ${
                    errors.newPassword
                      ? "peer-focus:text-red-500 text-red-500"
                      : "peer-focus:text-blue-500"
                  }
                  ${
                    formData.newPassword && !errors.newPassword
                      ? "text-blue-500"
                      : ""
                  }`}
              >
                New Password
              </label>
              {isNPasswordFocused && (
                <button
                  type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setIsCPasswordFocused(true)}
                onBlur={() => setIsCPasswordFocused(false)}
                placeholder=" "
                className={`peer w-full px-4 py-3 pr-12 border rounded-2xl bg-white 
                  focus:outline-none transition-all
                  ${
                    errors.confirmPassword
                      ? "border-red-500 border-1 focus:ring-red-500"
                      : "border-[#DDEAFC] focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  }`}
              />
              <label
                htmlFor="confirmPassword"
                className={`absolute left-5 transition-all duration-200 bg-white px-1 pointer-events-none 
                  text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                  peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs
                  -top-2.5 text-xs 
                  ${
                    formData.confirmPassword ? "hidden peer-focus:flex" : ""
                  }
                  ${
                    errors.confirmPassword
                      ? "peer-focus:text-red-500 text-red-500"
                      : "peer-focus:text-blue-500"
                  }
                  ${
                    formData.confirmPassword && !errors.confirmPassword
                      ? "text-blue-500"
                      : ""
                  }`}
              >
                Confirm New Password
              </label>
              {isCPasswordFocused && (
                <button
                  type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                  className={`absolute right-4 top-6.5 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer`}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
              
              {/* Error Message - moved inside the confirm password container */}
              <div className="h-5 mt-0.5">
                {errors.confirmPassword && (
                  <p className="text-red-500 text-left text-xs">
                    {errors.confirmPassword}
                  </p>
                )}

                 {errors.newPassword && (
                  <p className="text-red-500 text-left text-xs">
                    {errors.newPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reset Button - now with consistent spacing */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading || !formData.newPassword || !formData.confirmPassword}
              className={`w-full font-semibold py-3 rounded-xl transition-all
                ${
                loading || !formData.newPassword || !formData.confirmPassword
                  ? "bg-[#1A73E8]/40 cursor-not-allowed text-white"
                  : "bg-[#1A73E8] hover:bg-[#1557B0] text-white cursor-pointer"
              }`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>

        {/* Back to Login */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={16} className="mr-2 text-gray-700" />
          <button
            onClick={() => navigate("/staff/login")}
            className="text-sm text-gray-700 cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}