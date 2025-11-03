import { useCallback, useEffect, useRef, useState } from "react";

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  return { debouncedValue, cancel };
};

