import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EXTENSION_FETCH_MESSAGE_TYPE,
  extensionFetch,
  isAllowedExtensionFetchUrl,
  performPrivilegedFetch
} from "./extensionFetch";

describe("extensionFetch policy", () => {
  it("only allows HTTPS Cloudflare API URLs", () => {
    expect(
      isAllowedExtensionFetchUrl(
        "https://api.cloudflare.com/client/v4/accounts/abc/storage/kv/namespaces/def/values/key"
      )
    ).toBe(true);
    expect(isAllowedExtensionFetchUrl("http://api.cloudflare.com/client/v4")).toBe(false);
    expect(isAllowedExtensionFetchUrl("https://evil.example/api.cloudflare.com")).toBe(false);
  });
});

describe("performPrivilegedFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches allowed Cloudflare URLs and serializes the response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("snapshot", {
        status: 200,
        headers: { "content-type": "text/plain" }
      })
    );

    await expect(
      performPrivilegedFetch(
        {
          type: EXTENSION_FETCH_MESSAGE_TYPE,
          url: "https://api.cloudflare.com/client/v4/accounts/abc/storage/kv/namespaces/def/values/key",
          method: "GET",
          headers: { Authorization: "Bearer token" }
        },
        fetcher
      )
    ).resolves.toMatchObject({
      ok: true,
      status: 200,
      body: "snapshot"
    });
  });

  it("rejects URLs outside the Cloudflare API", async () => {
    const fetcher = vi.fn();
    await expect(
      performPrivilegedFetch(
        {
          type: EXTENSION_FETCH_MESSAGE_TYPE,
          url: "https://example.com/steal"
        },
        fetcher
      )
    ).resolves.toEqual({ error: "This URL is not allowed for extension fetch." });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("extensionFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses window fetch outside the extension service worker", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("chrome", undefined);

    const response = await extensionFetch("https://api.cloudflare.com/client/v4/ok");
    expect(fetchMock).toHaveBeenCalledOnce();
    await expect(response.text()).resolves.toBe("ok");
  });
});
