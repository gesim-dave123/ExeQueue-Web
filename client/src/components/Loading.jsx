import React from "react";

export default function Loading({ text = "Loading...", progress = 0 }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-full">
          <img src="/assets/icon.svg" alt="Queue Logo" className="w-30 h-30" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-2 bg-blue-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Loading Text */}
      <p className="mt-4 text-gray-700 font-medium">{text}</p>
    </div>
  );
}
