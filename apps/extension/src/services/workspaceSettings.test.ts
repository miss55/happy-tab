import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  getLocalStorageValue: vi.fn(),
  setLocalStorageValue: vi.fn()
}));

vi.mock("@/services/chromeStorage", () => storageMocks);

import {
  WORKSPACE_STORAGE_KEY,
  defaultWorkspaceSettings,
  initializeWorkspaceSettings,
  normalizeWorkspaceSettings,
  setShowTodos,
  useWorkspaceSettings
} from "@/services/workspaceSettings";

describe("workspaceSettings", () => {
  beforeEach(async () => {
    storageMocks.getLocalStorageValue.mockReset();
    storageMocks.setLocalStorageValue.mockReset();
    storageMocks.getLocalStorageValue.mockResolvedValue(undefined);
    storageMocks.setLocalStorageValue.mockResolvedValue(undefined);
    await initializeWorkspaceSettings();
  });

  it("hides todos unless the stored flag is exactly true", () => {
    expect(normalizeWorkspaceSettings(undefined)).toEqual(defaultWorkspaceSettings);
    expect(normalizeWorkspaceSettings({ showTodos: true })).toEqual({ showTodos: true });
    expect(normalizeWorkspaceSettings({ showTodos: false })).toEqual({ showTodos: false });
    expect(normalizeWorkspaceSettings({ showTodos: "true" })).toEqual({ showTodos: false });
    expect(normalizeWorkspaceSettings({})).toEqual({ showTodos: false });
  });

  it("loads stored workspace settings and persists todo visibility", async () => {
    storageMocks.getLocalStorageValue.mockResolvedValue({ showTodos: true });

    await initializeWorkspaceSettings();
    expect(useWorkspaceSettings().settings.value.showTodos).toBe(true);

    await setShowTodos(false);
    expect(storageMocks.setLocalStorageValue).toHaveBeenCalledWith(WORKSPACE_STORAGE_KEY, {
      showTodos: false
    });
    expect(useWorkspaceSettings().settings.value.showTodos).toBe(false);
  });

  it("falls back to hidden todos when storage cannot be read", async () => {
    storageMocks.getLocalStorageValue.mockRejectedValueOnce(new Error("storage unavailable"));

    await initializeWorkspaceSettings();
    expect(useWorkspaceSettings().settings.value.showTodos).toBe(false);
  });
});
