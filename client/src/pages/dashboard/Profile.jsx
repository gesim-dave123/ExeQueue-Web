import React, { useState } from "react";
import { useAuth } from "../../context/AuthProvider"; // ✅ Make sure this path matches your project

export default function Profile() {
  const { user, userFullName, setUserFullName } = useAuth(); // ✅ include userFullName + setter

  // ✅ Load initial data
  const savedData = {
    fullName: userFullName || user?.fullName || user?.name || "Default Name",
    username: user?.username || user?.userName || "defaultUser",
    email: user?.email || "default@example.com",
    password: "*******************",
  };

  const [originalData, setOriginalData] = useState(savedData);
  const [formData, setFormData] = useState(savedData);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ handle typing
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ✅ save changes and update global name
  const handleSave = () => {
    setOriginalData(formData);
    setUserFullName(formData.fullName); // ✅ updates name globally
    setIsEditing(false);
    console.log("Data saved:", formData);
  };

  // ✅ discard changes
  const handleDiscard = () => {
    setFormData(originalData);
    setIsEditing(false);
    console.log("Changes discarded.");
  };

  return (
    <div className="min-h-screen flex items-start lg:items-center py-7 px-3 xl:px-0 xl:pl-1 xl:pr-7">
      <div className="h-full w-full flex flex-col text-start rounded-3xl p-5 sm:p-8 xl:p-10 bg-white mt-12 lg:mt-0 shadow-xs">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl xl:text-4xl font-semibold">
          Profile
        </h1>
        <span className="text-sm sm:text-base xl:text-lg text-[#686969] mb-6 xl:mb-14">
          Manage your profile and account settings
        </span>

        {/* Card */}
        <div className="w-full flex flex-col p-5 lg:p-6 border border-gray-300 rounded-2xl xl:mb-12">
          {/* Header */}
          <div className="flex flex-row justify-between items-start sm:items-center gap-3 mb-5 lg:mb-8">
            <div className="flex gap-2 items-center">
              <img
                src="/assets/Profile/MyAccountProfile.png"
                alt="Profile Icon"
                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
              />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-medium">
                Personal Details
              </h3>
            </div>

            {isEditing ? (
              <button
                onClick={handleDiscard}
                className="flex border border-red-500 text-red-500 font-medium items-center py-2 px-3 lg:py-2.5 lg:px-4 gap-2 rounded-lg sm:rounded-xl text-sm lg:text-base w-auto"
              >
                Discard
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex border border-[#1A73E8] text-[#1A73E8] font-medium items-center py-2 px-3 lg:py-2.5 lg:px-4 gap-2 rounded-lg sm:rounded-xl text-sm lg:text-base w-auto"
              >
                <img
                  src="/assets/Profile/edit.png"
                  alt="Edit"
                  className="w-4 h-4"
                />
                Edit
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-10">
            {/* Left: Image + Name */}
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left w-full xl:w-1/3">
              <p className="text-xl sm:text-2xl lg:text-3xl xl:text-5xl font-semibold leading-normal mb-2">
                {formData.fullName}
              </p>
              <span className="text-sm sm:text-base lg:text-lg font-medium text-[#686969]">
                {user?.role === "WORKING_SCHOLAR"
                  ? "Working Scholar"
                  : "Personnel"}
              </span>
            </div>

            {/* Right: Inputs */}
            <div className="w-full xl:w-2/3 space-y-4 sm:space-y-5 lg:space-y-6">
              {/* Full name */}
              <div>
                <label className="text-xs sm:text-sm lg:text-base font-semibold">
                  Full name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F5F5] rounded-lg px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                    focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] 
                    ${isEditing ? "text-black" : "text-gray-500"}`}
                  disabled={!isEditing}
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs sm:text-sm lg:text-base font-semibold">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F5F5] rounded-lg px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                    focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] 
                    ${isEditing ? "text-black" : "text-gray-500"}`}
                  disabled={!isEditing}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs sm:text-sm lg:text-base font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F5F5] rounded-lg px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                    focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] 
                    ${isEditing ? "text-black" : "text-gray-500"}`}
                  disabled={!isEditing}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs sm:text-sm lg:text-base font-semibold">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F5F5] rounded-lg px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                    focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] 
                    ${isEditing ? "text-black" : "text-gray-500"}`}
                  disabled={!isEditing}
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-center lg:justify-end">
                <button
                  onClick={handleSave}
                  disabled={!isEditing}
                  className={`w-full sm:w-auto font-medium py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg sm:rounded-xl text-sm sm:text-base ${
                    isEditing
                      ? "bg-[#1A73E8] text-white"
                      : "bg-[#1A73E8]/40 text-white cursor-not-allowed"
                  }`}
                >
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
