// src/context/ForgotPasswordFlowContext.jsx

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const FlowContext = createContext(null);

export const useFlow = () => useContext(FlowContext);

const FlowProvider = ({ children }) => {
  const [flowToken, setFlowToken] = useState(null);
  const [flowEmail, setFlowEmail] = useState(null);
  const TIMER_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds
  // Ref to hold the auto-expiration timeout
  const expirationTimer = useRef(null);

  const startFlow = useCallback((email, token) => {
    // Clear any existing timer
    if (expirationTimer.current) {
      clearTimeout(expirationTimer.current);
    }
    setFlowEmail(email);
    setFlowToken(token);

    expirationTimer.current = setTimeout(() => {
      setFlowToken(null);
      setFlowEmail(null);
      showToast("Password reset session expired.", "warning");
    }, TIMER_DURATION);
  }, []);

  const clearFlow = useCallback(() => {
    if (expirationTimer.current) {
      clearTimeout(expirationTimer.current);
    }
    setFlowToken(null);
    setFlowEmail(null);
  }, []);

  const value = {
    flowToken,
    flowEmail,
    startFlow,
    clearFlow,
  };

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};
export default FlowProvider;
