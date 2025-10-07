import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";
import { useLoading } from "./LoadingProvider.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const { setIsLoading, setProgress, setLoadingText } = useLoading();
  const location = useLocation();

  // Animate the loading overlay while checking auth
  useEffect(() => {
    if (isLoading) {
      setIsLoading(true);
      setLoadingText("Authenticating...");
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : 90));
      }, 200);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 500); // smooth fade-out
    }
  }, [isLoading, setIsLoading, setProgress, setLoadingText]);

  // Block rendering of route while loading
  if (isLoading) {
    return null; // overlay is global, so nothing else renders
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
