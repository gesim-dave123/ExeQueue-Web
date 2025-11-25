import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";
import { useLoading } from "./LoadingProvider.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading, refreshAuth } = useAuth();
  const { setIsLoading, setProgress, setLoadingText } = useLoading();
  const location = useLocation();
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);
  const animationIntervalRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const CHECK_INTERVAL = 30 * 60 * 1000;

  const clearTimers = () => {
    if (animationIntervalRef.current)
      clearInterval(animationIntervalRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    animationIntervalRef.current = null;
    finishTimeoutRef.current = null;
  };

  const startAnimation = () => {
    clearTimers();
    setIsLoading(true);
    setLoadingText("Authenticating...");
    setProgress(0);
    setIsAnimationRunning(true);

    animationIntervalRef.current = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.random() * 15 : prev));
    }, 200);
  };

  const finishAnimation = async () => {
    clearTimers();
    if (isAnimationRunning) {
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));

      finishTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setIsAnimationRunning(false);
      }, 100);
    }
  };

  useEffect(() => {
    if (isLoading && !isAnimationRunning) {
      startAnimation();
    } else if (!isLoading && isAnimationRunning) {
      finishAnimation();
    }

    return () => clearTimers();
  }, [isLoading, isAnimationRunning]);

  useEffect(() => {
    if (!user || isLoading) {
      return;
    }
    const intervalId = setInterval(async () => {
      console.log("Heartbeat: Checking token validity...");
      await refreshAuth();
    }, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, isLoading, refreshAuth]);

  if (isLoading || isAnimationRunning) {
    return null;
  }

  if (!user) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
};

export { ProtectedRoute };
