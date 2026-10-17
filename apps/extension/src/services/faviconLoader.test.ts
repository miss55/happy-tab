import { afterEach, describe, expect, it, vi } from "vitest";
import { cachedFavicon, faviconInitial, preloadFavicon, rememberFavicon } from "./faviconLoader";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("favicon loading", () => {
  it("shares a pending image request and only succeeds after load", async () => {
    let image: { onload?: () => void; naturalWidth: number };
    const constructor = vi.fn(function (this: { onload?: () => void; naturalWidth: number }) { image = this; this.naturalWidth = 32; });
    vi.stubGlobal("Image", constructor);
    const first = preloadFavicon("https://icons.test/success.png");
    const second = preloadFavicon("https://icons.test/success.png");
    expect(first).toBe(second);
    expect(constructor).toHaveBeenCalledTimes(1);
    image!.onload!();
    await expect(first).resolves.toBe(true);
  });

  it("settles failed and stalled loads without caching them", async () => {
    vi.useFakeTimers();
    let image: { onerror?: () => void };
    vi.stubGlobal("Image", function (this: { onerror?: () => void }) { image = this; });
    const failed = preloadFavicon("https://icons.test/failed.png");
    image!.onerror!();
    await expect(failed).resolves.toBe(false);
    const stalled = preloadFavicon("https://icons.test/stalled.png");
    await vi.advanceTimersByTimeAsync(8000);
    await expect(stalled).resolves.toBe(false);
  });

  it("reuses icons on the same origin without leaking across sites", () => {
    rememberFavicon("https://cache.test/first", "https://icons.test/known.png");
    expect(cachedFavicon("https://cache.test/second")).toBe("https://icons.test/known.png");
    expect(cachedFavicon("https://other.test/")).toBeUndefined();
    expect(cachedFavicon("http://cache.test/")).toBeUndefined();
  });

  it("bounds the successful-icon cache", () => {
    rememberFavicon("https://oldest.test", "old.png");
    for (let index = 0; index < 128; index++) rememberFavicon(`https://site-${index}.test`, "new.png");
    expect(cachedFavicon("https://oldest.test")).toBeUndefined();
    expect(cachedFavicon("https://site-127.test")).toBe("new.png");
  });

  it("derives a compact initial and handles unavailable addresses", () => {
    expect(faviconInitial("https://www.example.com/path")).toBe("E");
    expect(faviconInitial("chrome://settings")).toBe("S");
    expect(faviconInitial()).toBe("·");
  });
});
