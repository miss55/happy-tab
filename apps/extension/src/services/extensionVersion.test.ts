import { afterEach, describe, expect, it, vi } from "vitest";
import { getExtensionVersion } from "./extensionVersion";

describe("getExtensionVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back when the Chrome runtime is unavailable", () => {
    vi.stubGlobal("chrome", undefined);
    expect(getExtensionVersion()).toBe("0.1.1");
  });

  it("reads the installed extension manifest version", () => {
    vi.stubGlobal("chrome", {
      runtime: {
        getManifest: () => ({ version: "2.4.0" })
      }
    });
    expect(getExtensionVersion()).toBe("2.4.0");
  });
});
