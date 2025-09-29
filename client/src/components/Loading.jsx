import React, { useEffect, useState } from "react";

export default function Loading({ text = "Loading..." }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          clearInterval(interval);
          return 100;
        }
        return old + 2; // speed of progress
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-full">
          {/* Replace with your own SVG or image */}
          <img src="/assets/icon.svg" alt="Queue Logo" className="w-12 h-12" />
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
