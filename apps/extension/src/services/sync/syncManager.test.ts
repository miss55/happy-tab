import { beforeEach, describe, expect, it, vi } from "vitest";

const providerMocks = vi.hoisted(() => ({
  pullSnapshot: vi.fn(),
  pushSnapshot: vi.fn(),
  testConnection: vi.fn()
}));

vi.mock("@/db/tabviaDb", () => ({
  tabviaDb: {
    link_groups: { toArray: vi.fn().mockResolvedValue([]) },
    links: { toArray: vi.fn().mockResolvedValue([]) },
    todos: { toArray: vi.fn().mockResolvedValue([]) },
    usage_stats: { toArray: vi.fn().mockResolvedValue([]) },
    nav_shortcuts: { toArray: vi.fn().mockResolvedValue([]) }
  }
}));

vi.mock("./providers", () => ({
  getStorageProvider: () => providerMocks
}));

import { getDefaultSyncConfig } from "@/storage/syncStorage";
import { CloudflareHostPermissionDeniedError } from "./cloudflareHostPermission";
import { HttpsEndpointRequiredError } from "./customRestSetup";
import { SyncDecryptError } from "./encryption";
import { buildLocalSnapshot, messageKeyFromSyncError, performSync } from "./syncManager";

describe("messageKeyFromSyncError", () => {
  it("maps typed sync errors to user-facing message keys", () => {
    expect(messageKeyFromSyncError(new CloudflareHostPermissionDeniedError(), "cloud.testFailed")).toBe(
      "cloud.cfPermissionDenied"
    );
    expect(messageKeyFromSyncError(new HttpsEndpointRequiredError(), "cloud.testFailed")).toBe(
      "cloud.httpsRequired"
    );
    expect(messageKeyFromSyncError(new Error("network"), "cloud.unexpectedError")).toBe(
      "cloud.unexpectedError"
    );
    expect(messageKeyFromSyncError(new SyncDecryptError(), "cloud.unexpectedError")).toBe(
      "cloud.decryptFailed"
    );
  });
});

describe("performSync", () => {
  beforeEach(() => {
    providerMocks.pullSnapshot.mockReset();
    providerMocks.pushSnapshot.mockReset();
  });

  it("does not upload local data when the remote snapshot cannot be decrypted", async () => {
    providerMocks.pullSnapshot.mockRejectedValue(new SyncDecryptError());
    providerMocks.pushSnapshot.mockResolvedValue(true);

    const result = await performSync({
      ...getDefaultSyncConfig(),
      enabled: true,
      encryptionKey: "wrong-password"
    });

    expect(result).toEqual({
      success: false,
      mode: "error",
      message: "cloud.decryptFailed"
    });
    expect(providerMocks.pushSnapshot).not.toHaveBeenCalled();
  });

  it("uploads the first snapshot when the remote store is empty", async () => {
    providerMocks.pullSnapshot.mockResolvedValue(null);
    providerMocks.pushSnapshot.mockResolvedValue(true);

    const result = await performSync({
      ...getDefaultSyncConfig(),
      enabled: true
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("pushed");
    expect(providerMocks.pushSnapshot).toHaveBeenCalledOnce();
  });
});

describe("buildLocalSnapshot", () => {
  it("does not upload a browser user agent or other device fingerprint", async () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 SecretBrowser" });

    const snapshot = await buildLocalSnapshot();

    expect(snapshot).not.toHaveProperty("device_name");
    expect(JSON.stringify(snapshot)).not.toContain("SecretBrowser");
    expect(JSON.stringify(snapshot)).not.toContain("Mozilla/5.0");

    vi.unstubAllGlobals();
  });
});
