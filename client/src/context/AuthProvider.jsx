import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { forceLogout, login, logout, verifyUser } from "../api/auth";
import { releaseServiceWindow } from "../api/staff.api";

axios.defaults.withCredentials = true;

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSystemLoading, setIsSystemLoading] = useState(false);

  const checkingAuth = useRef(false);
  const checkAuthRef = useRef(null);

  const PUBLIC_STAFF_PATHS = [
    "/staff/login",
    "/staff/forgot-password",
    "/staff/verify-otp",
    "/staff/reset-password",
    "/staff/success-reset",
  ];

  const cleanupSession = useCallback(async () => {
    try {
      await releaseServiceWindow();
    } catch (err) {
      console.warn(
        "Could not release service window (token might be expired):",
        err
      );
    }
    localStorage.removeItem("selectedWindow");
    console.log("Cleared 'selectedWindow' from localStorage.");
    try {
      await logout();
    } catch (err) {
      console.warn("API logout failed:", err);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    if (checkingAuth.current) return;

    if (user) {
      setIsSystemLoading(true);
    }

    checkingAuth.current = true;
    try {
      const data = await verifyUser();
      const currentUserId = user?.sasStaffId;
      const newUserId = data?.sasStaffId;

      if (currentUserId !== newUserId) {
        setUser(data || null);
      }
      setError(null);
      return data;
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setUser(null);
      setError(err.message);
      return null;
    } finally {
      checkingAuth.current = false;
      setIsSystemLoading(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthRef.current = checkAuth;
  }, [checkAuth]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "auth_logout_event") {
        setUser(null);
        return;
      }
      if (e.key === "auth_login_event") {
        const currentPath = window.location.pathname;
        if (!PUBLIC_STAFF_PATHS.includes(currentPath)) {
          console.log(
            "New account logged in elsewhere. Forcing refresh on non-auth staff route."
          ); // If the tab is on a protected route (like dashboard, queue, etc.) // which needs the new token, force the reload.
          window.location.reload();
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const loginOperation = useCallback(
    async (credentials) => {
      if (user) {
        console.log("Previous session detected. Cleaning up...");
        await cleanupSession(); // Release window of OLD user
        setUser(null);
      }
      try {
        const result = await login(credentials);

        if (result.success) {
          await checkAuth();
          localStorage.setItem("auth_login_event", Date.now().toString());
          localStorage.removeItem("auth_login_event");
        }

        return result;
      } catch (error) {
        console.error("Login operation failed unexpectedly:", error);
        return {
          success: false,
          message: "Network error or server unreachable.",
        };
      }
    },
    [checkAuth, user, cleanupSession]
  );

  const logoutOperation = useCallback(async () => {
    // Use the helper we created
    await cleanupSession();

    setUser(null);
    localStorage.setItem("auth_logout_event", Date.now().toString());
    localStorage.removeItem("auth_logout_event");
    return true;
  }, [cleanupSession]);

  const forceLogoutOperation = useCallback(async () => {
    try {
      await releaseServiceWindow();
      await forceLogout();
      setUser(null);
      localStorage.setItem("auth_logout_event", Date.now().toString());
      localStorage.removeItem("auth_logout_event");
      return true;
    } catch {
      return false;
    }
  }, []);

  const isAlreadyLoggedIn = useCallback(async () => {
    try {
      return !!(await verifyUser());
    } catch {
      return false;
    }
  }, []);

  const value = {
    user,
    isLoading,
    isSystemLoading,
    error,
    loginOperation,
    logoutOperation,
    forceLogoutOperation,
    isAlreadyLoggedIn,
    refreshAuth: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
