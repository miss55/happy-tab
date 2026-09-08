import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExtensionFaviconUrl, getFaviconCandidates } from "./faviconUrl";

describe("faviconUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the extension favicon service URL for http pages", () => {
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: (path: string) => `chrome-extension://abc${path}`
      }
    });

    expect(buildExtensionFaviconUrl("https://example.com/docs")).toBe(
      "chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fexample.com%2Fdocs&size=32"
    );
  });

  it("skips privileged stored favicons and prefers the extension favicon API", () => {
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: (path: string) => `chrome-extension://abc${path}`
      }
    });

    expect(getFaviconCandidates("https://example.com", "edge://favicon2/example.com")).toEqual([
      "chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fexample.com&size=32"
    ]);
  });

  it("falls back to a loadable stored https favicon outside the extension runtime", () => {
    vi.stubGlobal("chrome", undefined);

    expect(getFaviconCandidates("https://example.com", "https://example.com/favicon.ico")).toEqual([
      "https://example.com/favicon.ico"
    ]);
  });

  it("ignores chrome and data favicon URLs", () => {
    vi.stubGlobal("chrome", undefined);

    expect(getFaviconCandidates("chrome://settings", "chrome://favicon/size/16@1x/https://example.com")).toEqual(
      []
    );
  });
});
