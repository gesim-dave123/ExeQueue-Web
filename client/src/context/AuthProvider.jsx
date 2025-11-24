import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  checkLoginStatus,
  forceLogout,
  logout,
  verifyUser,
} from "../api/auth.js";
import { releaseServiceWindow } from "../api/staff.api.js";

axios.defaults.withCredentials = true; // send cookies automatically with requests

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const logoutInProgress = useRef(false);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await verifyUser();
      setUser(userData);
      setError(null);
      return userData;
    } catch (error) {
      console.error("Authentication check failed:", error);
      setUser(null);
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isAlreadyLoggedIn = useCallback(async () => {
    try {
      const status = await checkLoginStatus();
      return status.isLoggedIn;
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuth(); // check once on mount
  }, [checkAuth]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "auth_logout_event") {
        console.log("Logout detected from another tab");
        setUser(null);
        setError(null);
      }
      if (e.key === "auth_login_event") {
        console.log("Login detected from another tab");
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAuth]);

  // 🧩 login() is now simpler — you don't store token manually
  const saveUserData = useCallback((userData) => {
    setUser(userData);
    setError(null);
  }, []);

  const forceLogoutOperation = useCallback(async () => {
    if (logoutInProgress.current) {
      console.log("⚠️ Logout already in progress, skipping...");
      return;
    }
    logoutInProgress.current = true;

    try {
      // Try to release service window, but don't fail if it errors
      try {
        await releaseServiceWindow();
      } catch (err) {
        console.warn("Could not release service window:", err);
      }
      const logoutResult = await forceLogout();
      if (!logoutResult) throw new Error("Force logout failed");
      setUser(null);
      setError(null);

      // ✅ Notify other tabs
      localStorage.setItem("auth_logout_event", Date.now().toString());
      localStorage.removeItem("auth_logout_event");
      return true;
    } catch (error) {
      console.error("Force logout failed!", error);
      throw error;
    } finally {
      logoutInProgress.current = false;
    }
  }, []);

  const logoutOperation = useCallback(async () => {
    if (logoutInProgress.current) {
      console.warn("⚠️ Logout already in progress, skipping...");
      return;
    }
    logoutInProgress.current = true;
    try {
      const clearWindowAssignment = await releaseServiceWindow();
      if (!clearWindowAssignment) {
        throw new Error("There is a problem clearing Window Assignment");
      }
      const logoutUser = await logout();
      if (!logoutUser) throw new Error("Logout failed");
      setUser(null);
      setError(null);
      localStorage.setItem("auth_logout_event", Date.now().toString());
      localStorage.removeItem("auth_logout_event");
      return true;
    } catch (error) {
      console.error("Logout failed!", error);
      throw error;
    } finally {
      logoutInProgress.current = false;
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    saveUserData,
    logoutOperation,
    forceLogoutOperation,
    isAlreadyLoggedIn,
    refreshAuth: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
