import React from "react";

export default function GenerateQueue() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className=" min-h-[80vh] flex flex-col justify-between shadow-xl rounded-2xl w-full max-w-sm p-6 text-center">
        {/* Title */}
        <div className="gap-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Your Queue Number
        </h2> 

        {/* Queue Number */}
        <div className="border-2 border-yellow-400 rounded-lg py-15 mb-10">
          <span className="text-5xl font-bold text-yellow-500">P01</span>
        </div>

        {/* Divider */}
        <hr className="mb-6 border-dashed border-gray-300" />
        </div>
  
        {/* Details Section */}
        <div className="text-left mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Details</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Queue Type</span>
            <span className="bg-yellow-100 text-yellow-600 text-xs font-semibold px-3 py-1 rounded-full">
              Priority
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">
              Ref no.{" "}
              <a href="#" className="text-blue-600 hover:underline">
                0019-142-323
              </a>
            </span>
            <span className="text-gray-500 text-xs">
              September 19, 2025 &nbsp; 9:01 AM
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            View Queue
          </button>
          <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            ← Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
