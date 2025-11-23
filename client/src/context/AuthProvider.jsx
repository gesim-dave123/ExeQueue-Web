import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { logout, verifyUser } from "../api/auth.js";
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
  // 🧩 Check authentication via cookie
  const checkAuth = useCallback(async () => {
    try {
      const userData = await verifyUser(); // this calls backend /auth/check or /user/me
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

  useEffect(() => {
    checkAuth(); // check once on mount
  }, [checkAuth]);

  // 🧩 login() is now simpler — you don’t store token manually
  const saveUserData = useCallback((userData) => {
    setUser(userData);
    setError(null);
  }, []);

  // 🧩 logout() — backend clears cookie, frontend clears state
  // In AuthContext

  const logoutOperation = useCallback(async () => {
    // Prevent concurrent logout operations
    if (logoutInProgress.current) {
      console.log("⚠️ Logout already in progress, skipping...");
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

      return true; // Success
    } catch (error) {
      console.error("Logout failed!", error);
      throw error; // Re-throw to handle in calling components
    } finally {
      setUser(null);
      setError(null);
      logoutInProgress.current = false;
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    saveUserData,
    logoutOperation,
    refreshAuth: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
