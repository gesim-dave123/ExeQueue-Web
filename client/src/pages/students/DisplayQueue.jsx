import { useState } from "react";
import { ArrowLeft, Camera, Clock } from "lucide-react";

export default function DisplayQueue() {
  return (
    <div className="min-h-[90vh] w-full flex justify-center items-center flex-col px-4 py-6 ">
      {/* Note */}
      <div className="w-full max-w-md border border-dashed bg-white border-blue-400 rounded-xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 text-blue-600 text-xs sm:text-sm md:text-base font-semibold mb-4 flex items-center justify-center gap-2">
        <Camera size={18} className="flex-shrink-0" />
        <span className="text-center">
          Take a picture to keep note of your queue
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col p-6 sm:p-8 items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
            Regular
          </span>
          <p className="text-xs text-gray-500">
            Ref no.{" "}
            <span className="text-blue-600 font-semibold">0019-112-232</span>
          </p>
        </div>

        {/* Queue Number */}
        <span className="text-xs font-medium text-gray-600 mb-2">
          Your Queue Number
        </span>
        <h1 className="text-6xl sm:text-7xl font-bold text-blue-600 mb-2">
          R001
        </h1>

        {/* Divider */}
        <div className="w-full flex justify-center my-4">
          <div className="w-full border-t-2 border-dashed border-gray-300"></div>
        </div>

        {/* Details */}
        <div className="w-full space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="text-blue-600 font-medium">Jan Lorenz Laroco</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Student ID:</span>
            <span className="text-blue-600 font-medium">23123457</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-600">Requests:</span>
            <div className="flex flex-col items-end text-blue-600 font-medium text-right space-y-1">
              <span className="hover:underline cursor-pointer">
                Good Moral Certificate
              </span>
              <span className="hover:underline cursor-pointer">
                Insurance Payment
              </span>
              <span className="hover:underline cursor-pointer">
                Temporary Gate Pass
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full flex justify-center my-2">
          <div className="w-full border-t-2 border-dashed border-gray-300 mt-4"></div>
        </div>
        {/* Issued Date */}
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          <Clock size={15} />
          <span>Issued on 2025-09-21 9:01 AM</span>
        </div>
      </div>

      {/* Footer Button */}
      <div className="w-full max-w-md flex justify-center">
        <button className="mt-10 w-full   bg-blue-600 hover:bg-blue-700 text-white   text-sm font-medium px-4 py-4 rounded-xl flex items-center justify-center gap-2">
          <ArrowLeft size={17} /> Back to Homepage
        </button>
      </div>
    </div>
  );
}
