
import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import icon from "/assets/icon.svg";
import { useNavigate } from "react-router-dom";
import { login } from "../../../api/auth";
import { useAuth } from "../../../context/AuthProvider";
import { useLoading } from "../../../context/LoadingProvider";

export default function StaffLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });
  
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const { setIsLoading, setProgress, setLoadingText } = useLoading();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setLoadingText("Logging In...");
    setProgress(0);

    const res = await login(formData);
    if (!res?.success) {
      setIsLoading(false);
      // Set error messages based on response
      setErrors({
        username: res?.field === "username" ? res?.message || "Invalid username" : "",
        password: res?.field === "password" ? res?.message || "Invalid password" : "",
      });
      return;
    }

    // Simulate progress
    await new Promise((resolve) => setTimeout(resolve, 100));
    setProgress(100);

    // Wait a bit for the user to see full progress
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Refresh auth and navigate
    await refreshAuth();
    navigate("/staff/dashboard", { replace: true });

    // Give Framer Motion time to animate fade out
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-transparent p-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg">
        {/* Logo + Title */}
        <div className="flex items-center justify-center gap-3 mb-20 mt-5">
          <img src="/assets/login-logo.png" alt="Logo" className="w-14 h-13" />
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            ExeQueue
          </h1>
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl text-gray-900 font-semibold text-center mb-6">
          Welcome!
        </h1>
        <p className="text-gray-600 text-center mb-8 text-sm">
          Enter to manage queue
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username Input */}
          <div className="relative">
            <label
              htmlFor="username"
              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                formData.username
                  ? "-top-2.5 text-xs bg-white px-1"
                  : "top-3 text-base text-gray-500"
              } ${
                errors.username
                  ? "text-red-500"
                  : formData.username
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-2xl focus:outline-none transition-all ${
                errors.username
                  ? "border-red-500 focus:ring-2 focus:ring-red-500"
                  : "border-[#DDEAFC] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.username}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="relative">
            <label
              htmlFor="password"
              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                formData.password
                  ? "-top-2.5 text-xs bg-white px-1"
                  : "top-3 text-base text-gray-500"
              } ${
                errors.password
                  ? "text-red-500"
                  : formData.password
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border border-[#DDEAFC] rounded-2xl focus:outline-none transition-all pr-12 ${
                errors.password
                  ? "border-red-500 focus:ring-2 focus:ring-red-500"
                  : "border-[#DDEAFC] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
            {formData.password && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={() => navigate("/staff/forgot-password")}
              className="text-sm text-[#1A73E8] cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-xl transition-all cursor-pointer ${
              loading
                ? "bg-[#1A73E8] cursor-not-allowed text-white"
                : "bg-[#1A73E8] hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>

        {/* Back to Homepage */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={16} className="mr-2 text-gray-700" />
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-700  cursor-pointer"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}

