import React, { useState } from "react";
import { ArrowLeftCircle, RefreshCw, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileSidebar() {
  const [activeItem, setActiveItem] = useState("release");
  const navigate = useNavigate();

  return (
    <div className="hidden min-h-screen w-[43vh] xl:flex bg-[#F5F5F5] shadow-xl">
      <div className="min-w-[35vh] ml-20 flex flex-col py-10 px-6">
        <ArrowLeftCircle
          onClick={() => navigate("/")}
          size={55}
          className="mb-20 text-[#88898A] cursor-pointer"
        />

        <span className="text-start mb-2 text-xl text-gray-600">
          System Settings
        </span>

        <button
          onClick={() => {
            setActiveItem("reset");
            navigate("/dashboard/manage-account");
          }}
          className={`flex items-center gap-3 mb-2 w-full px-3 py-2 rounded-xl transition-colors duration-200 ${
            activeItem === "reset"
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-800"
          }`}
        >
          <RefreshCw
            size={20}
            className={`${
              activeItem === "reset" ? "text-blue-500" : "text-gray-800"
            }`}
          />
          <span className="text-lg font-medium">Reset Queue</span>
        </button>

        <button
          onClick={() => {
            setActiveItem("release");
            navigate("/dashboard/transactions");
          }}
          className={`flex items-center gap-3 mb-20 w-full px-3 py-2 rounded-xl transition-colors duration-200 ${
            activeItem === "release"
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-800"
          }`}
        >
          <Monitor
            size={20}
            className={`${
              activeItem === "release" ? "text-blue-500" : "text-gray-800"
            }`}
          />
          <span className="text-lg font-medium">Release Window</span>
        </button>

        <span className="text-start mb-3 text-xl text-gray-600">
          My Account
        </span>

        <button
          onClick={() => setActiveItem("profile")}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-colors duration-200 ${
            activeItem === "profile"
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-800"
          }`}
        >
          <img
            src="/assets/dashboard/personnel.png"
            alt="User"
            className="w-7 h-7"
          />
          <span className="text-lg font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
