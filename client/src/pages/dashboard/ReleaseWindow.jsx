import React from "react";

export default function ReleaseWindow() {
  return (
    <div className="min-h-screen lg:h-screen flex items-center lg:text-start py-7 px-3 sm:px-5 lg:px-7">
      <div className="h-full w-full p-5 sm:p-8 lg:p-10 bg-white rounded-2xl sm:rounded-3xl">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 sm:mb-12">
          Release Window
        </h1>

        {/* Window 1 */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6 lg:gap-0 mb-10">
          <div className="flex flex-col gap-3 sm:gap-5 text-center lg:text-left">
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium">
              Release Window 1
            </p>
            <span className="text-sm sm:text-base lg:text-lg text-[#555]">
              Unassign the personnel currently managing Window 1.
            </span>
          </div>

          <button className="bg-[#1A73E8] text-sm sm:text-base lg:text-xl text-white font-medium px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl lg:rounded-2xl">
            Release Window 1
          </button>
        </div>

        {/* Window 2 */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6 lg:gap-0">
          <div className="flex flex-col gap-3 sm:gap-5 text-center lg:text-left">
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium">
              Release Window 2
            </p>
            <span className="text-sm sm:text-base lg:text-lg text-[#555]">
              Unassign the personnel currently managing Window 2.
            </span>
          </div>

          <button className="bg-[#1A73E8] text-sm sm:text-base lg:text-xl text-white font-medium px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl lg:rounded-2xl">
            Release Window 2
          </button>
        </div>
      </div>
    </div>
  );
}
