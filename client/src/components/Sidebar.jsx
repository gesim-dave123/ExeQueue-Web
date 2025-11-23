import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConfirmModal from "../components/modal/ConfirmModal";
import { useAuth } from "../context/AuthProvider";
import { useLoading } from "../context/LoadingProvider";
import { useIsSystemOpen } from "../context/ModalCheckerProvider";
import { showToast } from "./toast/ShowToast";
import icon from "/assets/icon.svg";

export default function Sidebar() {
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("");
  const [hover, setHover] = useState("");
  const [subItem, setSubItem] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [activeDropdownItem, setActiveDropdownItem] = useState("");
  const navigate = useNavigate();
  const { logoutOperation } = useAuth();
  const location = useLocation();
  const [isHeightSmall, setIsHeightSmall] = useState(false);
  const [isSystemSOpen, setIsSystemSOpen] = useIsSystemOpen();
  const [loading, setLoading] = useState(false);
  const { setIsLoading, setProgress, setLoadingText } = useLoading();

  const handleCloseModal = () => {
    setShowLogoutModal(false);
    setIsProfileOpen(false);
  };

  const handleLogout = async () => {
    handleCloseModal();
    setIsLoading(true);
    setLoadingText("Logging Out...");
    setProgress(0);

    // Start progress animation immediately and independently
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Gradually increase progress, but cap at 90% until logout completes
        if (prev < 90) {
          return prev + Math.random() * 15;
        }
        return prev;
      });
    }, 200);

    try {
      // Logout happens in parallel with progress animation
      await logoutOperation();

      // Clear the interval once logout completes
      clearInterval(progressInterval);

      // Animate to 100% and WAIT for it to complete
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Wait for progress to visually reach 100%

      showToast("Logged Out Successfully!", "success");

      // Optional: brief pause at 100% so user sees completion
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now navigate
      navigate("/staff/login");

      // Clean up loading states after navigation
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 100);
    } catch (error) {
      clearInterval(progressInterval); // Clear interval on error
      console.error("There was a problem logging out:", error);
      showToast("There was a problem logging out", "error");
      setIsLoading(false);
      setProgress(0);
    }
  };
  const [userFullName, setUserFullName] = useState("Staff");
  const [userRole, setUserRole] = useState("Unknown");
  const { user } = useAuth();

  const commonNavItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "/assets/dashboard/dashboard bnw.png",
      iconActive: "/assets/dashboard/dashboard colored.png",
      link: "/staff/dashboard",
    },
    {
      key: "queue",
      label: "Queue",
      icon: "/assets/dashboard/queue.png",
      iconActive: "/assets/dashboard/queue colored.png",
      subItems: [
        {
          key: "manage-queue",
          label: "Manage Queue",
          link: "/staff/queue/manage",
          requiresWindow: true,
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
        iconActive: "/assets/dashboard/manage colored.png",
        link: "/staff/manage/account",
      },

      {
        key: "transactions",
        label: "Transactions",
        icon: "/assets/dashboard/transactions.png",
        iconActive: "/assets/dashboard/transactions colored.png",
        link: "/staff/transaction/history",
      },
      {
        key: "analytics",
        label: "Analytics",
        icon: "/assets/dashboard/analytics.png",
        iconActive: "/assets/dashboard/analytics colored.png",
        link: "/staff/analytics",
      },
    ],
    WORKING_SCHOLAR: [
      {
        key: "transactions",
        label: "Transactions",
        icon: "/assets/dashboard/transactions.png",
        iconActive: "/assets/dashboard/transactions colored.png",
        link: "/staff/transaction/history",
      },
    ],
  };

  const sidebarItems = [
    ...commonNavItems,
    ...(roleBasedItems[user?.role] || []),
  ];

  const handleSystemSettingsClick = () => {
    setActiveItem("system-settings");
    if (!isSystemSettingsOpen) {
      setIsProfileOpen(true); // make sure parent stays open
      setIsSystemSettingsOpen(true);
    } else {
      setIsSystemSettingsOpen(false);
    }
  };

  useEffect(() => {
    setIsSystemSOpen(isSystemSettingsOpen); // true if open, false if closed
  }, [isSystemSettingsOpen]);

  // Add this useEffect to handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the dropdown
      const dropdown = document.querySelector(
        '[data-dropdown="profile-dropdown"]'
      );
      const profileButton = document.querySelector("[data-profile-button]");

      if (
        isProfileOpen &&
        dropdown &&
        !dropdown.contains(event.target) &&
        profileButton &&
        !profileButton.contains(event.target)
      ) {
        setIsProfileOpen(false);
        setIsSystemSettingsOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const checkHeight = () => {
      setIsHeightSmall(window.innerHeight < 600); // Adjust threshold as needed
    };

    checkHeight();
    window.addEventListener("resize", checkHeight);
    return () => window.removeEventListener("resize", checkHeight);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 768; // everything below 1024 = mobile
      setIsMobileView(isMobile);
      setIsSidebarOpen(!isMobile && width >= 1280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen || (!isMobileView && !isMobileOpen)) {
      setIsSystemSettingsOpen(false);
      setIsProfileOpen(false);
    }
  }, [isSidebarOpen, isMobileOpen, isMobileView]);

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
    if (location.state?.activeKey) {
      const key = location.state.activeKey;
      setActiveItem(key);

      // if the returned key is a queue sub-item, open the queue and set subItem
      if (key === "manage-queue" || key === "display-queue") {
        setIsQueueOpen(true);
        setSubItem(key);
      } else {
        // clear subItem for top-level items
        setSubItem("");
      }
    }
  }, [location.state]);

  // Fallback: highlight according to current URL (keeps highlight on refresh/direct nav)
  useEffect(() => {
    const p = location.pathname;
    if (p.includes("/staff/queue/manage")) {
      setActiveItem("queue");
      setIsQueueOpen(true);
      setSubItem("manage-queue");
    } else if (p.includes("/staff/queue/display")) {
      setActiveItem("queue");
      setIsQueueOpen(true);
      setSubItem("display-queue");
    } else if (p.includes("/staff/transaction")) {
      setActiveItem("transactions");
      setSubItem("");
    } else if (p.includes("/staff/manage/account")) {
      setActiveItem("accounts");
      setSubItem("");
    } else if (p.includes("/staff/dashboard")) {
      setActiveItem("dashboard");
      setSubItem("");
    } else if (p.includes("/staff/analytics")) {
      setActiveItem("analytics");
      setSubItem("");
    }
    // extend with other URL patterns you use
  }, [location.pathname]);
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
    // Handle logout separately
    if (item === "logout") {
      setShowLogoutModal(true);
      return;
    }

    // Handle profile and system settings dropdown toggles
    if (item === "profile") {
      // 🧠 If sidebar is closed, open it first
      if (!isOpen) {
        setIsSidebarOpen(true);
        setIsMobileOpen(true);
        setTimeout(() => {
          setIsProfileOpen(true);
          setIsSystemSettingsOpen(false);
          setActiveItem("profile");
        }, 300); // Wait for sidebar animation
      } else {
        // If sidebar is already open, just toggle dropdown
        setIsProfileOpen((prev) => !prev);
        setIsSystemSettingsOpen(false);
        setActiveItem("profile");
      }
      return;
    }

    if (item === "system-settings") {
      setIsSystemSettingsOpen((prev) => !prev);
      setIsProfileOpen(false);
      setActiveItem("system-settings");
      return; // ⛔ Stop here — don't close the sidebar
    }

    // For system settings sub-items (queue-reset, release-window, profile-settings)
    if (["queue-reset", "release-window", "profile-settings"].includes(item)) {
      setActiveDropdownItem(item);
      setIsProfileOpen(true);
      setIsSystemSettingsOpen(true);
    }

    // For all other regular navigation items
    setActiveItem(item);
    setSubItem("");
    setIsQueueOpen(false);

    // ✅ Only close the sidebar on mobile for navigation items
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
            className="p-2 transform -translate-x-[20%] bg-white rounded-md shadow-md"
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
          overflow-visible
        `}
      >
        {/* Scrollable Content Area */}
        <div
          className={` flex flex-col h-full ${
            isHeightSmall ? "overflow-y-auto flex-1" : "overflow-visible flex-0"
          }`}
          style={{
            maxHeight: isHeightSmall ? "calc(100vh - 120px)" : "none",
          }}
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
                        setIsSystemSOpen(false);
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
                          src={
                            activeItem === item.key
                              ? item.iconActive
                              : item.icon
                          }
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
                                onClick={() => {
                                  setSubItem(sub.key);
                                  setIsSystemSOpen(false);

                                  if (isMobileView) setIsMobileOpen(false);
                                }}
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
                    onClick={() => {
                      handleItemClick(item.key);
                      setIsSystemSOpen(false);
                    }}
                    className={`flex items-center gap-2 justify-start px-2 py-2.5 rounded-lg transition-colors duration-300
                    ${
                      activeItem === item.key
                        ? "bg-[#DDEAFC] text-[#1A73E8] font-medium"
                        : "text-black hover:bg-blue-50"
                    }`}
                  >
                    <img
                      src={
                        activeItem === item.key ? item.iconActive : item.icon
                      }
                      alt={item.label}
                      className="w-6 h-6 transition-opacity duration-300"
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
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {!isMobileView && !isSidebarOpen && (
          <div
            className={`flex-1 w-full cursor-pointer h-full
              ${isHeightSmall ? "hidden" : "flex"} `}
            onClick={() => {
              setIsSidebarOpen(true);
            }}
          ></div>
        )}

        {/* Bottom User Section with Dropdown - Fixed at bottom */}
        <div
          className={`pb-4 mt-auto ${
            isOpen ? "px-3" : ""
          } relative overflow-visible`}
        >
          {/* Profile Button */}
          <div
            data-profile-button
            onClick={() => {
              handleItemClick("profile");
            }}
            className={`flex items-center justify-start pl-2 gap-3 rounded-lg transition-colors duration-300 cursor-pointer ${
              isOpen ? "py-1.5" : "ml-3 mr-3 py-2.5"
            } ${
              activeItem === "profile"
                ? "bg-[#DDEAFC] text-[#1A73E8] font-medium"
                : "text-black hover:bg-blue-50"
            }`}
          >
            <div className="w-6 h-7 rounded-full flex items-center justify-center  flex-shrink-0">
              <img src="/assets/dashboard/personnel.png" alt="User" />
            </div>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{
                opacity: isOpen ? 1 : 0,
                width: isOpen ? "auto" : 0,
              }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              <div
                className={`text-sm font-medium truncate max-w-[150px]
                ${isOpen ? "flex" : "hidden"}
                ${
                  activeItem === "profile" ? "text-[#1A73E8]" : "text-gray-900"
                }`}
                title={userFullName} // Shows full name on hover
              >
                {userFullName}
              </div>
              <div
                className={`text-xs ${
                  activeItem === "profile" ? "text-[#1A73E8]" : "text-gray-500"
                } text-start`}
              >
                {userRole}
              </div>
            </motion.div>
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isProfileOpen && isOpen && (
              <motion.div
                data-dropdown="profile-dropdown"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col p-1.5 absolute w-[260px] bg-white shadow-[0px_4px_15px_rgba(0,0,0,0.1)] rounded-[18px] z-[9999] bottom-full mb-2 left-0"
              >
                {/* New Button at Top */}
                <div
                  className="relative"
                  onClick={(e) => e.stopPropagation()} //  Prevent parent (profile) from toggling
                  onMouseEnter={() => {
                    if (!isMobileView && user?.role === "PERSONNEL")
                      setIsSystemSettingsOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (!isMobileView && user?.role === "PERSONNEL")
                      setIsSystemSettingsOpen(false);
                  }}
                >
                  {/* System Settings Button */}
                  {user?.role === "WORKING_SCHOLAR" && (
                    <>
                      <div
                        onClick={() => {
                          handleItemClick("profile-settings");
                          setIsSystemSOpen(false);
                          navigate("/staff/profile/profile-settings", {
                            state: {
                              from: location.pathname,
                              fromKey: subItem || activeItem,
                            },
                          });
                        }}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer ${
                          activeDropdownItem === "profile-settings"
                            ? "bg-white text-gray-700 font-medium"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        <img
                          src="/assets/dashboard/system_settings_dropdown/profilee.png"
                          alt="profile"
                          className="w-6 h-6"
                        />
                        <span className="text-sm font-medium">Profile</span>
                      </div>
                    </>
                  )}

                  {user?.role === "PERSONNEL" && (
                    <>
                      <div
                        onClick={handleSystemSettingsClick}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer mb-1.5
                  ${
                    activeItem === "system-settings"
                      ? "bg-[#DDEAFC] text-[#1A73E8] font-medium"
                      : "text-gray-700 hover:bg-blue-50"
                  }
                  `}
                      >
                        <img
                          src="/assets/dashboard/system_setting.png"
                          alt="System Setting"
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">
                          System Settings
                        </span>
                        <img
                          src="/assets/dashboard/system_settings_arrow.png"
                          alt="arrow"
                          className={`w-5 h-5 ml-auto transition-transform duration-300 ${
                            isSystemSettingsOpen
                              ? "rotate-90 sm:rotate-180"
                              : "-rotate-90 sm:rotate-0"
                          }`}
                        />
                      </div>
                    </>
                  )}

                  {/* System Settings Dropdown */}
                  {/* System Settings Dropdown (Role-based) */}
                  <AnimatePresence>
                    {isSystemSettingsOpen && (
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col p-1.5 absolute w-[250px] bg-white shadow-lg rounded-[18px] z-[9999]  ml-2 ${
                          isMobileView
                            ? "-top-35 left-20"
                            : "-bottom-13  left-60"
                        }`}
                        data-dropdown="profile-dropdown"
                      >
                        {/* PERSONNEL: Show all options */}
                        {user?.role === "PERSONNEL" && (
                          <>
                            <div
                              onClick={() => {
                                handleItemClick("queue-reset");
                                setIsSystemSOpen(false);
                                navigate("/staff/profile/reset-queue", {
                                  state: {
                                    from: location.pathname,
                                    fromKey: subItem || activeItem,
                                  },
                                });
                              }}
                              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer mb-1.5 ${
                                activeDropdownItem === "queue-reset"
                                  ? "bg-white text-gray-700 font-medium"
                                  : "text-gray-700 hover:bg-blue-50"
                              }`}
                            >
                              <img
                                src="/assets/dashboard/system_settings_dropdown/reset-icon.png"
                                alt="reset"
                                className="w-5 h-5"
                              />
                              <span className="text-sm font-medium">
                                Queue Reset Settings
                              </span>
                            </div>

                            <div
                              onClick={() => {
                                handleItemClick("release-window");
                                setIsSystemSOpen(false);
                                navigate("/staff/profile/release-window", {
                                  state: {
                                    from: location.pathname,
                                    fromKey: subItem || activeItem,
                                  },
                                });
                              }}
                              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer mb-1.5 ${
                                activeDropdownItem === "release-window"
                                  ? "bg-white text-gray-700 font-medium"
                                  : "text-gray-700 hover:bg-blue-50"
                              }`}
                            >
                              <img
                                src="/assets/profileMonitor.png"
                                alt="window"
                                className="w-5 h-5"
                              />
                              <span className="text-sm font-medium">
                                Release Window
                              </span>
                            </div>
                          </>
                        )}
                        {/* BOTH PERSONNEL & WORKING_SCHOLAR: Show Profile */}
                        {user?.role === "PERSONNEL" && (
                          <>
                            <div
                              onClick={() => {
                                handleItemClick("profile-settings");
                                setIsSystemSOpen(false);
                                navigate("/staff/profile/profile-settings", {
                                  state: {
                                    from: location.pathname,
                                    fromKey: subItem || activeItem,
                                  },
                                });
                              }}
                              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors duration-300 cursor-pointer ${
                                activeDropdownItem === "profile-settings"
                                  ? "bg-white text-gray-700 font-medium"
                                  : "text-gray-700 hover:bg-blue-50"
                              }`}
                            >
                              <img
                                src="/assets/dashboard/system_settings_dropdown/profilee.png"
                                alt="profile"
                                className="w-5 h-5"
                              />
                              <span className="text-sm font-medium">
                                Profile
                              </span>
                            </div>
                          </>
                        )}
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
                      ? "bg-[#DDEAFC] text-[#1A73E8]  font-medium"
                      : "text-gray-700 hover:bg-blue-50"
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
        confirmText="Confirm"
        showCloseButton={false}
        hideActions={false}
        cancelButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer"
        confirmButtonClass="px-4 py-3 bg-[#1A73E8] text-white hover:bg-blue-700 rounded-xl cursor-pointeed-xl w-1/2 font-medium cursor-pointer"
        description={
          <>
            Ready to log out?
            <br />
            You can always sign back in anytime.
          </>
        }
      />
    </>
  );
}
