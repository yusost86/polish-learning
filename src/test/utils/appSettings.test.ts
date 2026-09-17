import { afterEach, describe, expect, it } from "vitest";

import { DEV_MODE_STORAGE_KEY, readDevMode, writeDevMode } from "../../utils/appSettings";

afterEach(() => {
  localStorage.removeItem(DEV_MODE_STORAGE_KEY);
});

describe("appSettings", () => {
  it("defaults to false when unset", () => {
    expect(readDevMode()).toBe(false);
  });

  it("reads true only for the string true", () => {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, "true");
    expect(readDevMode()).toBe(true);

    localStorage.setItem(DEV_MODE_STORAGE_KEY, "false");
    expect(readDevMode()).toBe(false);

    localStorage.setItem(DEV_MODE_STORAGE_KEY, "1");
    expect(readDevMode()).toBe(false);
  });

  it("persists the toggle", () => {
    writeDevMode(true);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe("true");
    expect(readDevMode()).toBe(true);

    writeDevMode(false);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe("false");
    expect(readDevMode()).toBe(false);
  });
});
