import { useCallback, useState } from "react";

import { readDevMode, writeDevMode } from "../utils/appSettings";

export interface UseAppSettingsResult {
  devMode: boolean;
  setDevMode: (value: boolean) => void;
}

export function useAppSettings(): UseAppSettingsResult {
  const [devMode, setDevModeState] = useState(() => readDevMode());

  const setDevMode = useCallback((value: boolean) => {
    writeDevMode(value);
    setDevModeState(value);
  }, []);

  return { devMode, setDevMode };
}
