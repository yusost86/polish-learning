export const DEV_MODE_STORAGE_KEY = "polish-learning:devMode";

export function readDevMode(): boolean {
  try {
    return localStorage.getItem(DEV_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeDevMode(value: boolean): void {
  try {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, value ? "true" : "false");
  } catch {
    // ignore quota / private mode
  }
}
