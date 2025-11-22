import { useState, useEffect } from "react";

let isSystemSettingsOpen = false;
let listeners = []; // to notify components

export const setIsSystemSettingOpen = (value) => {
  isSystemSettingsOpen = value;
  listeners.forEach((listener) => listener(isSystemSettingsOpen));
};

export const useIsSystemOpen = () => {
  const [state, setState] = useState(isSystemSettingsOpen);

  useEffect(() => {
    const listener = (value) => setState(value);
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return [state, setIsSystemSettingOpen];
};  