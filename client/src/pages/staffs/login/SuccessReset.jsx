import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";

export default function SuccessReset({ imageSrc, onLogin }) {
    const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Image */}
        <div className="flex justify-center mb-6">
          {imageSrc ? (
            <img 
              src="/assets/success.png"
              alt="Password Reset Success" 
              className="w-64 h-48 object-contain"
            />
          ) : (
            <div className="w-64 h-48  rounded-lg flex items-center justify-center">
              <img src="/assets/success.png" alt="" className="w-96" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm mb-2">
            Your password has been reset
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Successfully
          </h1>
        </div>

        {/* Login Button */}
        <button
          onClick={() => navigate("/staff/login")}
          className="w-full bg-[#1A73E8]  hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-colors duration-200 cursor-pointer"
        >
          Login
        </button>
      </div>
    </div>
  );
}