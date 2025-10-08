import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import icon from "/assets/icon.svg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import ConfirmModal from "../components/modal/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import ManageAccount from "../pages/dashboard/ManageAccount";
import Transactions from "../pages/dashboard/Transactions";

export default function Sidebar() {
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [subItem, setSubItem] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [activeDropdownItem, setActiveDropdownItem] = useState("");
  const navigate = useNavigate();

  const handleCloseModal = () => {
    setShowLogoutModal(false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const [userFullName, setUserFullName] = useState("Staff");
  const [userRole, setUserRole] = useState("Unknown");
  const { user } = useAuth();

  const commonNavItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "/assets/dashboard/dashboard bnw.png",
      link: "/staff/dashboard",
    },
    {
      key: "queue",
      label: "Queue",
      icon: "/assets/dashboard/queue.png",
      subItems: [
        {
          key: "manage-queue",
          label: "Manage Queue",
          link: "/staff/queue/manage",
        },
        {
          key: "display-queue",
          label: "Display Queue",
          link: "/staff/queue/display",
        },
      ],
    },
  ];
  // Role-specific items
  const roleBasedItems = {
    PERSONNEL: [
      {
        key: "accounts",
        label: "Manage Accounts",
        icon: "/assets/dashboard/manage.png",
        link: "/staff/manage/account",
      },
      {
        key: "transactions",
        label: "Transactions",
        icon: "/assets/dashboard/transactions.png",
        link: "/staff/transaction/history",
      },
      {
        key: "analytics",
        label: "Analytics",
        icon: "/assets/dashboard/analytics.png",
        link: "/staff/analytics",
      },
    ],
    WORKING_SCHOLAR: [
      {
        key: "transactions",
        label: "Transactions",
        icon: "/assets/dashboard/transactions.png",
        link: "/staff/transaction/history",
      },
    ],
  };

  const sidebarItems = [
    ...commonNavItems,
    ...(roleBasedItems[user?.role] || []),
  ];
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 1024) {
        setIsMobileView(true);
        setIsSidebarOpen(false);
        setIsMobileOpen(false);
      } else if (width >= 1024 && width < 1280) {
        setIsMobileView(false);
        setIsSidebarOpen(false);
      } else {
        setIsMobileView(false);
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);

      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fullName = user.middleName
      ? `${user.lastName}, ${user.firstName} ${user.middleName}`
      : `${user.lastName}, ${user.firstName}`;
    setUserFullName(fullName);

    const formattedRole = user?.role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    setUserRole(formattedRole);
  }, [user]);

  const handleItemClick = (item) => {
    setActiveItem(item);
    if (item === "logout") {
      setShowLogoutModal(true);
      // setIsProfileOpen(false);
      // setIsSystemSettingsOpen(false);
      return;
    }

  if (["queue-reset", "release-window", "profile-settings"].includes(item)) {
  setActiveDropdownItem(item);
  }

  if (item === "profile") {
    setIsProfileOpen(!isProfileOpen);
    setIsSystemSettingsOpen(false);
  } else if (item === "system-settings") {
    setIsSystemSettingsOpen(!isSystemSettingsOpen);
  } else {
    setIsProfileOpen(false);
    setIsSystemSettingsOpen(false);
  }

  setSubItem("");
  setIsQueueOpen(false);
  if (isMobileView) setIsMobileOpen(false);

    if (item === "profile") {
      setIsProfileOpen(!isProfileOpen);
      setIsSystemSettingsOpen(false);
    }
     else if (item === "system-settings") {
    setIsSystemSettingsOpen(!isSystemSettingsOpen);
     }
    else {
      setIsProfileOpen(false);
      setIsSystemSettingsOpen(false);
    }

    setSubItem("");
    setIsQueueOpen(false);
    if (isMobileView) setIsMobileOpen(false);
  };

  const isOpen = isMobileView ? isMobileOpen : isSidebarOpen;

  return (
    <>
      {/* Hamburger for mobile */}
      {isMobileView && (
        <motion.div
          className="fixed top-4 z-50"
          initial={false}
          animate={{
            x: isMobileOpen ? 260 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 transform -translate-x-[40%] bg-white rounded-full shadow-md"
          >
            <img
              src="/assets/dashboard/minimize.png"
              alt="Toggle Sidebar"
              className="w-6 h-6"
            />
          </button>
        </motion.div>
      )}

      {/* Mobile Overlay */}
      {isMobileView && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Desktop Overlay */}
      {!isMobileView && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 xl:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 260 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`
          fixed top-0 left-0 h-full bg-white shadow-xs z-40 flex flex-col
          rounded-r-3xl xl:rounded-3xl 
          ${isMobileView && !isOpen ? "-translate-x-full" : "translate-x-0"}
          md:translate-x-0 xl:static
        `}
      >
        {!isMobileView && isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-3 w-8 h-8 flex items-center justify-center cursor-pointer translate-y-[30%] -translate-x-[20%]"
          >
            <img
              src="/assets/dashboard/minimize.png"
              alt="Toggle Sidebar"
              className="w-6 h-6"
            />
          </button>
        )}

        {/* Logo */}
        <div
          className={`flex items-center justify-start pt-5 ${
            !isMobileView && !isSidebarOpen ? "mb-0" : "mb-10"
          }`}
        >
          <img
            src={icon}
            alt="Exequeue Logo"
            className="w-[70px] h-[70px] transform -translate-y-[20%]"
          />
          <motion.h1
            className="text-xl font-bold ml-2 overflow-hidden transform -translate-y-[50%] -translate-x-[10%]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={false}
            animate={{
              opacity: isOpen ? 1 : 0,
              x: isOpen ? 0 : -20,
              width: isOpen ? "auto" : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            ExeQueue
          </motion.h1>
        </div>

        {!isMobileView && !isSidebarOpen && (
          <div
            className="w-full h-10 cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
          ></div>
        )}

        {/* Nav Items */}
        <div className="flex flex-col gap-2 px-3">
          {sidebarItems.map((item) => {
            if (item.key === "queue") {
              return (
                <div key={item.key} className="flex flex-col w-full">
                  <button
                    onClick={() => {
                      setIsSidebarOpen(true);
                      setIsQueueOpen(!isQueueOpen);
                      setActiveItem("queue");
                    }}
                    className={`w-full flex items-center pr-2 justify-between cursor-pointer py-2.5 rounded-lg transition-colors duration-300
                      ${
                        activeItem === "queue"
                          ? "bg-[#DDEAFC] text-[#1A73E8] font-medium"
                          : "text-black hover:bg-blue-50"
                      }`}
                  >
                    <div
                      className={`flex items-center ${isOpen ? "gap-4" : ""}`}
                    >
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="w-6 h-6 transform translate-x-[35%]"
                      />
                      <motion.span
                        className="whitespace-nowrap overflow-hidden"
                        initial={false}
                        animate={{
                          opacity: isOpen ? 1 : 0,
                          x: isOpen ? 0 : -20,
                          width: isOpen ? "auto" : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    </div>
                    {isOpen &&
                      (isQueueOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      ))}
                  </button>

                  <AnimatePresence>
                    {isQueueOpen && isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4"
                      >
                        {item.subItems.map((sub) => (
                          <div
                            key={sub.key}
                            className="flex justify-center w-full"
                          >
                            <Link
                              to={sub.link}
                              onClick={() => setSubItem(sub.key)}
                              className={`block w-[80%] text-left py-2 text-sm rounded-md transition ${
                                subItem === sub.key
                                  ? "text-[#1A73E8] font-medium"
                                  : "text-gray-700 hover:text-[#1A73E8]"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return (
              <div className="flex flex-col w-full">
                <Link
                  key={item.key}
                  to={item.link}
                  onClick={() => handleItemClick(item.key)}
                  className={`flex items-center gap-2 justify-start px-2 py-2.5 rounded-lg transition-colors duration-300
                  ${
                    activeItem === item.key
                      ? "bg-[#DDEAFC] text-[#1A73E8] font-medium"
                      : "text-black hover:bg-blue-50"
                  }`}
                >
                  <img src={item.icon} alt={item.label} className="w-6 h-6" />
                  <motion.span
                    className="whitespace-nowrap overflow-hidden"
                    initial={false}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      x: isOpen ? 0 : -20,
                      width: isOpen ? "auto" : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              </div>
            );
          })}
        </div>

        {!isMobileView && !isSidebarOpen && (
          <div
            className="flex-1 w-full cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
          ></div>
        )}

        {/* Bottom User Section with Dropdown */}
        <div className={`pb-4 mt-auto ${isOpen ? "px-3" : ""} relative`}>
          {/* Profile Button */}
          <div
            onClick={() => handleItemClick("profile")}
            className={`flex items-center gap-3 rounded-lg transition-colors duration-300 cursor-pointer py-2.5 ${
              isOpen ? "px-2" : "justify-center"
            } ${
              activeItem === "profile"
                ? "bg-white   font-medium"
                : "text-black"
            }`}
          >
            <div className="w-10 h-15 rounded-full flex items-center justify-center flex-shrink-0">
              <img src="/assets/dashboard/personnel.png" alt="User" />
            </div>
            {isOpen && (
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {userFullName}
                </div>
                <div className="text-xs text-gray-500 text-start">{userRole}</div>
              </div>
            )}
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isProfileOpen && isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col p-1.5 absolute w-[260px] bg-white shadow-[0px_4px_15px_rgba(0,0,0,0.1)] rounded-[18px] z-50 top-[-100px]"
              >
                {/* New Button at Top */}
                <div className="relative">
                  <div 
                    onClick={() => handleItemClick("system-settings")}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer mb-1.5
                      ${
                        activeItem === "system-settings"
                          ? "bg-[#DDEAFC] font-medium"
                          : "text-gray-700"
                      }`}
                  >
                    <img
                      src="/assets/dashboard/system_setting.png"
                      alt="System Setting"
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">System Settings</span>
                    <img
                      src="/assets/dashboard/system_settings_arrow.png"
                      alt="arrow"
                      className={`w-5 h-5 ml-auto`}
                    />
                  </div>

                  {/* System Settings Dropdown */}
                  <AnimatePresence>
                    {isSystemSettingsOpen && isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col p-1.5 absolute w-[250px] bg-white shadow-[0px_4px_15px_rgba(0,0,0,0.1)] rounded-[18px] z-50 top-[-40px] left-full -ml-4"
                      >
                        {/* Add your system settings options here */}
                        <div 
                          onClick={() => handleItemClick("queue-reset")}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer mb-1.5
                            ${
                              activeDropdownItem === "queue-reset"
                                ? "bg-[#DDEAFC]   font-medium"
                                : "text-gray-700"
                            }`}
                        >                          <img
                            src="/assets/dashboard/system_settings_dropdown/reset-icon.png"
                            alt="reset"
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium">Queue Reset Settings</span>
                        </div>
                        <div className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-700 cursor-pointer transition-colors duration-200 rounded-xl mb-1.5">
                          <img
                            src="/assets/dashboard/system_settings_dropdown/window.png"
                            alt="window"
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium">Release Window</span>
                        </div>
                        <div className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-700 cursor-pointer transition-colors duration-200 rounded-xl">
                          <img
                            src="/assets/dashboard/system_settings_dropdown/profilee.png"
                            alt="profile"
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium">Profile</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Log Out Button at Bottom */}
                <div 
                onClick={() => handleItemClick("logout")}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer
                  ${
                    activeItem === "logout"
                      ? "bg-[#DDEAFC]   font-medium"
                      : "text-gray-700"
                  }`}
              >
                  <img
                    src="/assets/dashboard/logout.png"
                    alt="Log Out"
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">Log Out</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={handleCloseModal}
        onConfirm={handleLogout}
        icon="/assets/user_dropdown/caution_logout.png"
        iconAlt="Warning"
        iconSize="w-12 h-12"
        showLoading={true}
        title="Log out"
        cancelText="Cancel"
        confirmText="Logout"
        showCloseButton={false}  
        hideActions={false} 
        cancelButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer"
        confirmButtonClass="px-4 py-3 bg-[#1A73E8] text-white hover:bg-blue-700 rounded-xl cursor-pointeed-xl w-1/2 font-medium cursor-pointer"
        description={
          <>
            Ready to log out?<br />
            You can always sign back in anytime.
          </>
        }
      />
    </>
  );
}