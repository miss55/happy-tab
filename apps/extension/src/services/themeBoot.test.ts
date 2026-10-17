import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const script = readFileSync(new URL("../../public/theme-boot.js", import.meta.url), "utf8");
const boot = (raw: string | null, dark = false, blocked = false) => {
  const properties = new Map<string, string>();
  const root = { dataset: {} as Record<string, string>, style: {
    backgroundColor: "", colorScheme: "",
    setProperty: (key: string, value: string) => properties.set(key, value)
  } };
  const append = vi.fn();
  runInNewContext(script, {
    localStorage: { getItem: () => { if (blocked) throw new Error("blocked"); return raw; } },
    document: { documentElement: root, head: { append }, createElement: () => ({}) },
    CSS: { supports: (_name: string, value: string) => /^#[a-f0-9]{6}$/i.test(value) },
    matchMedia: () => ({ matches: dark }), URL,
    location: { href: "chrome-extension://example/index.html", protocol: "chrome-extension:", host: "example" }
  });
  return { root, properties, append };
};

describe("theme first paint", () => {
  it("restores the user's dark paint before the application bundle", () => {
    const result = boot(JSON.stringify({ version: 1, mode: "dark", modeSetting: "dark", style: "cyber", baseColor: "#123456" }));
    expect(result.root.style.backgroundColor).toBe("#123456");
    expect(result.root.style.colorScheme).toBe("dark");
    expect(result.root.dataset.themeStyle).toBe("cyber");
    expect(result.properties.get("--theme-bg")).toBe("#123456");
  });

  it("follows a changed system appearance instead of replaying an old color", () => {
    const result = boot(JSON.stringify({ version: 1, mode: "light", modeSetting: "system", style: "soft", baseColor: "#ffffff" }), true);
    expect(result.root.dataset.theme).toBe("dark");
    expect(result.root.style.backgroundColor).toBe("#0b1120");
  });

  it("preloads only a packaged wallpaper and bounds its overlay", () => {
    const result = boot(JSON.stringify({ version: 1, mode: "dark", wallpaper: "/assets/lake.webp", overlay: 4 }));
    expect(result.append).toHaveBeenCalledOnce();
    expect(result.properties.get("--theme-background-image")).toContain("chrome-extension://example/assets/lake.webp");
    expect(result.properties.get("--theme-background-overlay")).toBe("1");
    for (const wallpaper of ["https://remote.test/picture.webp", "blob:old-page", "/unknown/picture.webp"]) {
      expect(boot(JSON.stringify({ version: 1, mode: "dark", wallpaper })).append).not.toHaveBeenCalled();
    }
  });

  it("continues without a missing, corrupt, incompatible, or inaccessible hint", () => {
    for (const raw of [null, "{", JSON.stringify({ version: 9, mode: "dark" })]) {
      expect(boot(raw).root.dataset).toEqual({});
    }
    expect(() => boot(null, false, true)).not.toThrow();
  });
});
