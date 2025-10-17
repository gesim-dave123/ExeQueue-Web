import React from "react";

export default function Profile() {
  return (
    <div className="min-h-screen 2xl:h-screen flex items-center py-7 px-3 xl:px-0 xl:pl-1 xl:pr-7">
      <div className="h-full w-full flex flex-col text-start rounded-3xl p-5 sm:p-8 xl:p-10 bg-white">
        <h1 className="text-2xl sm:text-3xl xl:text-4xl font-semibold">
          Profile
        </h1>
        <span className="text-sm sm:text-base xl:text-lg text-[#686969] mb-6 xl:mb-10">
          Manage your profile and account settings
        </span>

        <div className="w-full flex flex-col p-4 sm:p-6 border border-gray-300 rounded-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 pl-1 sm:pl-2 mb-6 sm:mb-10">
            <div className="flex gap-2 items-center">
              <img
                src="/assets/Profile/MyAccountProfile.png"
                alt=""
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
              <h3 className="text-lg sm:text-xl xl:text-2xl font-medium">
                Personal Details
              </h3>
            </div>

            <button className="flex border border-[#1A73E8] text-[#1A73E8] font-medium items-center py-2 px-3 gap-2 rounded-xl self-start sm:self-auto">
              <img src="/assets/Profile/edit.png" alt="" className="w-4 h-4" />
              Edit
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-10">
            {/* Left: Image + Name */}
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left w-full xl:w-1/3">
              <img
                src="/assets/Profile/ProfilePic.png"
                alt=""
                className="w-32 h-32 sm:w-40 sm:h-40 xl:w-52 xl:h-52 rounded-full mb-4 flex self-center"
              />
              <p className="text-2xl sm:text-3xl xl:text-5xl font-semibold leading-normal mb-3">
                Lance Timothy Satorre
              </p>
              <span className="text-base sm:text-lg font-medium text-[#686969]">
                Personnel
              </span>
            </div>

            {/* Right: Inputs */}
            <div className="w-full xl:w-2/3 py-3 sm:py-5 text-start">
              <span className="text-sm sm:text-md font-semibold">
                Full name
              </span>
              <input
                type="text"
                placeholder="Lance Timothy Satorre"
                className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 sm:py-4 mt-2 mb-4 sm:mb-5 text-sm sm:text-base"
                disabled
              />

              <span className="text-sm sm:text-md font-semibold">Username</span>
              <input
                type="text"
                placeholder="lansattor213"
                className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 sm:py-4 mt-2 mb-4 sm:mb-5 text-sm sm:text-base"
                disabled
              />

              <span className="text-sm sm:text-md font-semibold">Email</span>
              <input
                type="text"
                placeholder="lanztim@example.com"
                className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 sm:py-4 mt-2 mb-4 sm:mb-5 text-sm sm:text-base"
                disabled
              />

              <span className="text-sm sm:text-md font-semibold">Password</span>
              <input
                type="text"
                placeholder="*******************"
                className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 sm:py-4 mt-2 mb-6 sm:mb-7 text-sm sm:text-base"
                disabled
              />

              <div className="w-full flex justify-center lg:justify-end">
                <button className="bg-[#1A73E8] text-sm sm:text-md text-white font-medium py-3 sm:py-4 px-4 sm:px-5 rounded-xl sm:rounded-2xl">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
