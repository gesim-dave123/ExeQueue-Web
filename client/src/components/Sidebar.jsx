import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import icon from "/assets/icon.svg";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ManageAccount from "../pages/dashboard/ManageAccount";
import Transactions from "../pages/dashboard/Transactions";

export default function Sidebar() {
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [subItem, setSubItem] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024); // mobile + tablet + lg
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280); // open only for xl and up
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 1024) {
        // Mobile or tablet
        setIsMobileView(true);
        setIsSidebarOpen(false);
        setIsMobileOpen(false);
      } else if (width >= 1024 && width < 1280) {
        // lg screens → sidebar closed by default
        setIsMobileView(false);
        setIsSidebarOpen(false);
      } else {
        // xl and above → sidebar open
        setIsMobileView(false);
        setIsSidebarOpen(true);
      }
    };

    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);

      // Reset overlays when switching between views
      if (mobile) {
        setIsSidebarOpen(false); // ensure desktop sidebar is closed
      } else {
        setIsMobileOpen(false); // ensure mobile sidebar is closed
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleItemClick = (item) => {
    setActiveItem(item);
    setSubItem("");
    setIsQueueOpen(false);
    if (isMobileView) setIsMobileOpen(false);
  };

  // Unified "open" state
  const isOpen = isMobileView ? isMobileOpen : isSidebarOpen;

  return (
    <>
      {/* Hamburger for mobile */}
      {isMobileView && (
        <motion.div
          className="fixed top-4 z-50"
          initial={false}
          animate={{
            x: isMobileOpen ? 260 : 0, // follow sidebar width
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
          rounded-r-3xl xl:rounded-3xl overflow-hidden
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
            className="w-[70px] h-[70px]  transform -translate-y-[20%]"
          />
          <motion.h1
            className="text-xl font-bold ml-2 overflow-hidden transform -translate-y-[50%] -translate-x-[10%] "
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
            className=" w-full h-10 cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
          ></div>
        )}

        {/* Nav Items */}
        <div className="flex flex-col gap-2 px-3">
          {/* Dashboard */}
          <Link
            to="/dashboard"
            onClick={() => handleItemClick("dashboard")}
            className={`flex items-center  rounded-lg transition-colors duration-300 py-2.5
    ${
      activeItem === "dashboard"
        ? "bg-[#DDEAFC] text-[#1A73E8] font-medium"
        : "text-black hover:bg-blue-50"
    }
  `}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <img
                src="/assets/dashboard/dashboard bnw.png"
                alt="Dashboard"
                className="w-6 h-6 transform  translate-x-[35%]"
              />
            </div>
            <motion.span
              className="ml-4 whitespace-nowrap overflow-hidden"
              initial={false}
              animate={{
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : -20,
                width: isOpen ? "auto" : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              Dashboard
            </motion.span>
          </Link>
          {/* Queue */}
          <div className="flex flex-col w-full">
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
              <div className={`flex items-center ${isOpen ? "gap-4" : ""}`}>
                <img
                  src="/assets/dashboard/queue.png"
                  alt="Queue"
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
                  Queue
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
                  <Link
                    to="/dashboard/manage-queue"
                    onClick={() => setSubItem("manage-queue")}
                    className={`block py-2 text-sm transition
              ${
                subItem === "manage-queue"
                  ? "text-[#1A73E8] font-medium"
                  : "text-gray-600 hover:text-blue-600"
              }`}
                  >
                    Manage Queue
                  </Link>
                  <Link
                    to="/dashboard/display-queue"
                    onClick={() => setSubItem("display-queue")}
                    className={`block py-2 text-sm transition
              ${
                subItem === "display-queue"
                  ? "text-[#1A73E8] font-medium"
                  : "text-gray-600 hover:text-blue-600"
              }`}
                  >
                    Display Queue
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other nav items */}
          {["accounts", "transactions", "analytics"].map((item, idx) => {
            const iconMap = {
              accounts: "/assets/dashboard/manage.png",
              transactions: "/assets/dashboard/transactions.png",
              analytics: "/assets/dashboard/analytics.png",
            };
            const labelMap = {
              accounts: "Manage Accounts",
              transactions: "Transactions",
              analytics: "Analytics",
            };
            const linkMap = {
              accounts: "/dashboard/manage-account",
              transactions: "/dashboard/transactions",
              analytics: "/dashboard/analytics",
            }
            return (
              <Link
                to={linkMap[item]}
                key={idx}
                onClick={() => handleItemClick(item)}
                className={`flex items-center gap-2 justify-start px-2 py-2.5 rounded-lg transition-colors duration-300
                ${
                  activeItem === item
                    ? "bg-[#DDEAFC] text-[#1A73E8] font-medium"
                    : "text-black hover:bg-blue-50"
                }`}
              >
                <img
                  src={iconMap[item]}
                  alt={labelMap[item]}
                  className="w-6 h-6"
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
                  {labelMap[item]}
                </motion.span>
              </Link>
            );
          })}
        </div>

        {!isMobileView && !isSidebarOpen && (
          <div
            className="flex-1 w-full cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
          ></div>
        )}

        {/* Bottom User Section */}
        <div
          className={`pb-4 mt-auto flex ${
            isOpen ? "items-center gap-3 px-3" : "justify-center"
          }`}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
            <img src="/assets/dashboard/personnel.png" alt="User" />
          </div>
          {isOpen && (
            <div>
              <div className="text-sm font-medium text-gray-900">
                Lance Timothy Satorre
              </div>
              <div className="text-xs text-gray-500 text-start">Personnel</div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
