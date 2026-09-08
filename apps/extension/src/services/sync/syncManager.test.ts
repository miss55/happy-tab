import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/happyTabDb", () => ({
  happyTabDb: {
    link_groups: { toArray: vi.fn().mockResolvedValue([]) },
    links: { toArray: vi.fn().mockResolvedValue([]) },
    todos: { toArray: vi.fn().mockResolvedValue([]) },
    usage_stats: { toArray: vi.fn().mockResolvedValue([]) }
  }
}));

import { CloudflareHostPermissionDeniedError } from "./cloudflareHostPermission";
import { HttpsEndpointRequiredError } from "./customRestSetup";
import { buildLocalSnapshot, messageKeyFromSyncError } from "./syncManager";

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
