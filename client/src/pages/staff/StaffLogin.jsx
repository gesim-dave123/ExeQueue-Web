import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import icon from "/assets/icon.svg";

export default function StaffLogin() {
  const [username, setUsername] = useState("");
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br p-8 bg-gray-200/20">
      {/* Card */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl mb-5">
        {/* Logo + Title */}
        <div className="flex items-center justify-center gap-2 top-1/2 transform -translate-y-[30%]">
          <img src={icon} alt="Logo" className="w-25 h-25 sm:w-35 sm:h-35" />
          <h1
            className="left-1/2 transform -translate-x-[20%]  text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            ExeQueue
          </h1>
        </div>

        {/* Welcome Message */}
        <h2 className="text-3xl text-gray-800 font-semibold text-center mb-2">
          Welcome!
        </h2>
        <p className="text-gray-700 text-center mb-10">Enter to manage queue</p>

        {/* Form */}
        <form className="flex flex-col gap-4">
          <div className="relative">
            {isUsernameFocused && (
              <span
                className={`absolute left-3 -top-2 text-[11px] font-medium bg-white px-1 transition-colors duration-200 ${
                  isUsernameFocused ? "text-blue-500" : "text-gray-700"
                }`}
              >
                Username
              </span>
            )}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Password Input with Eye Icon */}
          <div className="relative">
            {isPasswordFocused && (
              <span
                className={`absolute left-3 -top-2 text-[11px] font-medium bg-white px-1 transition-colors duration-200 ${
                  isPasswordFocused ? "text-blue-500" : "text-gray-700"
                }`}
              >
                Password
              </span>
            )}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
            />
            {password && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff size={25} /> : <Eye size={25} />}
              </button>
            )}
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <a
              href="/student/search-queue"
              className="text-sm text-blue-500 hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        {/* Back to Homepage */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={18} className="mr-2 text-gray-700" />
          <a
            href="#"
            className="text-sm text-gray-700 font-medium hover:underline"
          >
            Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
