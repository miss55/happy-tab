import { describe, expect, it } from "vitest";
import { isUpstashConfigured, UPSTASH_CONSOLE_URL, UPSTASH_REDIS_CONSOLE_URL } from "./upstashSetup";

describe("upstashSetup", () => {
  it("points setup links at HTTPS Upstash console pages", () => {
    expect(UPSTASH_CONSOLE_URL).toBe("https://console.upstash.com/");
    expect(UPSTASH_REDIS_CONSOLE_URL).toBe("https://console.upstash.com/redis");
  });

  it("treats Upstash as configured only when REST URL and token are both present", () => {
    expect(isUpstashConfigured("", "token")).toBe(false);
    expect(isUpstashConfigured("https://example.upstash.io", "")).toBe(false);
    expect(isUpstashConfigured("  https://example.upstash.io  ", "  token  ")).toBe(true);
  });
});
