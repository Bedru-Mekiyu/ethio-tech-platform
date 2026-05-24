import { describe, expect, it } from "vitest";
import { getDashboardPath, getSettingsPath } from "./authStore";

describe("getDashboardPath", () => {
  it("routes roles correctly", () => {
    expect(getDashboardPath("student")).toBe("/app/dashboard");
    expect(getDashboardPath("mentor")).toBe("/mentor");
    expect(getDashboardPath("admin")).toBe("/admin");
    expect(getDashboardPath("parent")).toBe("/parent");
  });

  it("routes settings correctly", () => {
    expect(getSettingsPath("student")).toBe("/app/settings");
    expect(getSettingsPath("mentor")).toBe("/mentor/settings");
    expect(getSettingsPath("admin")).toBe("/admin/settings");
    expect(getSettingsPath("parent")).toBe("/parent/settings");
  });
});
