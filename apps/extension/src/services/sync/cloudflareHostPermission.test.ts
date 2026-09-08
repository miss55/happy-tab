import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLOUDFLARE_API_HOST_PERMISSION,
  CloudflareHostPermissionDeniedError,
  ensureCloudflareHostPermission,
  hasCloudflareHostPermission,
  requireCloudflareHostPermission
} from "./cloudflareHostPermission";

describe("cloudflareHostPermission", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats missing chrome.permissions as already granted", async () => {
    vi.stubGlobal("chrome", undefined);
    await expect(hasCloudflareHostPermission()).resolves.toBe(true);
    await expect(ensureCloudflareHostPermission()).resolves.toBe(true);
  });

  it("returns true when the optional host permission is already granted", async () => {
    const contains = vi.fn().mockResolvedValue(true);
    const request = vi.fn();
    vi.stubGlobal("chrome", {
      permissions: { contains, request }
    });

    await expect(ensureCloudflareHostPermission()).resolves.toBe(true);
    expect(contains).toHaveBeenCalledWith({ origins: [CLOUDFLARE_API_HOST_PERMISSION] });
    expect(request).not.toHaveBeenCalled();
  });

  it("requests the Cloudflare origin when it has not been granted yet", async () => {
    const contains = vi.fn().mockResolvedValue(false);
    const request = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("chrome", {
      permissions: { contains, request }
    });

    await expect(ensureCloudflareHostPermission()).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith({ origins: [CLOUDFLARE_API_HOST_PERMISSION] });
  });

  it("throws when the user denies the Cloudflare host permission", async () => {
    vi.stubGlobal("chrome", {
      permissions: {
        contains: vi.fn().mockResolvedValue(false),
        request: vi.fn().mockResolvedValue(false)
      }
    });

    await expect(requireCloudflareHostPermission()).rejects.toBeInstanceOf(
      CloudflareHostPermissionDeniedError
    );
  });
});
