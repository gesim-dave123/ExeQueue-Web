import React, { useState } from "react";
import { ArrowLeftCircle, RefreshCw, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileSidebar() {
  const [activeItem, setActiveItem] = useState("release");
  const [isOpen, setIsOpen] = useState(false); // sidebar open/close
  const [isClosing, setIsClosing] = useState(false); // for animation
  const navigate = useNavigate();

  const menuItems = [
    {
      key: "reset",
      label: "Reset Queue",
      icon: <RefreshCw size={20} />,
      path: "/dashboard/manage-account",
    },
    {
      key: "release",
      label: "Release Window",
      icon: <Monitor size={20} />,
      path: "/profile/release-window",
    },
    {
      key: "profile",
      label: "Profile",
      icon: (
        <img
          src="/assets/dashboard/personnel.png"
          alt="User"
          className="w-6 h-6"
        />
      ),
      path: "/profile/profile-settings",
    },
  ];

  const handleNavigate = (item) => {
    setActiveItem(item.key);
    navigate(item.path);
    handleClose(); // close after clicking (mobile only)
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300); // match the CSS transition duration
  };

  return (
    <>
      {/* ===== Overlay (blur background when sidebar open) ===== */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 xl:hidden z-40 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={handleClose}
      />

      {/* ===== Mobile / Tablet Sidebar (toggleable) ===== */}
      <div
        className={`fixed top-0 left-0 h-full w-[250px] bg-[#F5F5F5] shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out xl:hidden z-50`}
      >
        <div className="relative flex flex-col py-10 px-6">
          {/* Minimize Button (animated when closing) */}
          {isOpen && (
            <button
              className={`absolute top-4 -right-12 bg-white p-2 rounded-md shadow-md transform transition-all duration-300 ${
                isClosing ? "rotate-180 scale-90 opacity-50" : "rotate-0"
              }`}
              onClick={handleClose}
            >
              <img src="/assets/dashboard/minimize.png" alt="close sidebar" />
            </button>
          )}

          <ArrowLeftCircle
            onClick={() => navigate("/")}
            size={40}
            className="mb-10 text-[#88898A] cursor-pointer"
          />

          <span className="text-start mb-2 text-lg text-gray-600">
            System Settings
          </span>

          {menuItems.slice(0, 2).map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item)}
              className={`flex items-center gap-3 px-3 py-4 rounded-xl transition-colors duration-200 ${
                activeItem === item.key
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-200 text-gray-800"
              } ${item.key === "reset" ? "mb-3" : ""}`}
            >
              {React.cloneElement(item.icon, {
                className:
                  activeItem === item.key ? "text-blue-500" : "text-gray-800",
              })}
              <span className="text-base font-medium">{item.label}</span>
            </button>
          ))}

          <span className="text-start mt-8 mb-3 text-lg text-gray-600">
            My Account
          </span>

          {menuItems.slice(2).map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item)}
              className={`flex items-center gap-3 px-3 py-4 rounded-xl transition-colors duration-200 ${
                activeItem === item.key
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-200 text-gray-800"
              }`}
            >
              {item.icon}
              <span className="text-base font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Desktop Sidebar (always open, fixed width) ===== */}
      <div className="hidden xl:flex fixed top-0 left-0 h-screen bg-[#F5F5F5] w-90 z-40 lg:pl-15">
        <div className="flex flex-col py-10 px-3 w-full overflow-y-auto">
          <ArrowLeftCircle
            onClick={() => navigate("/")}
            size={55}
            className="mb-20 text-[#88898A] cursor-pointer"
          />

          <span className="text-start mb-2 text-xl text-gray-600">
            System Settings
          </span>

          {menuItems.slice(0, 2).map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-200 ${
                activeItem === item.key
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-200 text-gray-800"
              } ${item.key === "reset" ? "mb-3" : ""}`}
            >
              {React.cloneElement(item.icon, {
                className:
                  activeItem === item.key ? "text-blue-500" : "text-gray-800",
              })}
              <span className="text-lg font-medium">{item.label}</span>
            </button>
          ))}

          <span className="text-start mb-3 mt-8 text-xl text-gray-600">
            My Account
          </span>

          {menuItems.slice(2).map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-200 ${
                activeItem === item.key
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-200 text-gray-800"
              }`}
            >
              {item.icon}
              <span className="text-lg font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Mobile Toggle Button (open when closed) ===== */}
      {!isOpen && (
        <button
          className="xl:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-md transition-transform duration-300"
          onClick={() => setIsOpen(true)}
        >
          <img src="/assets/dashboard/minimize.png" alt="open sidebar" />
        </button>
      )}
    </>
  );
}
