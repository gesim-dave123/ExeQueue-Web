import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";
import { useLoading } from "./LoadingProvider.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading, refreshAuth } = useAuth();
  const { setIsLoading, setProgress, setLoadingText } = useLoading();
  const location = useLocation();

  // Animate the loading overlay while checking auth
  useEffect(() => {
    let interval;
    let timeout;

    if (isLoading) {
      setIsLoading(true);
      setLoadingText("Authenticating...");
      setProgress(0);

      interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : 90));
      }, 200);

      const handleAuth = async () => {
        try {
          await refreshAuth();
          // Authentication complete - finish loading
          setProgress(100);
          timeout = setTimeout(() => setIsLoading(false), 500);
        } catch (error) {
          // Handle auth error
          console.error("Authentication failed:", error);
          setIsLoading(false);
        }
      };

      handleAuth();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, setIsLoading, setProgress, setLoadingText, refreshAuth]);

  if (isLoading) {
    return null;
  }

  // Now we can safely redirect if user is not logged in
  if (!user) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
};

export { ProtectedRoute };
