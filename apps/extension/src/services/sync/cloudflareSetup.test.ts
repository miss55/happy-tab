import { describe, expect, it } from "vitest";
import {
  CLOUDFLARE_API_TOKENS_URL,
  CLOUDFLARE_DASHBOARD_URL,
  CLOUDFLARE_KV_CONSOLE_URL,
  isCloudflareKvConfigured
} from "./cloudflareSetup";

describe("cloudflareSetup", () => {
  it("points setup links at HTTPS Cloudflare dashboard pages", () => {
    expect(CLOUDFLARE_DASHBOARD_URL).toBe("https://dash.cloudflare.com/");
    expect(CLOUDFLARE_KV_CONSOLE_URL).toBe("https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces");
    expect(CLOUDFLARE_API_TOKENS_URL).toBe("https://dash.cloudflare.com/profile/api-tokens");
  });

  it("treats Cloudflare KV as configured only when account, namespace, and token are present", () => {
    expect(isCloudflareKvConfigured("", "ns", "token")).toBe(false);
    expect(isCloudflareKvConfigured("account", "", "token")).toBe(false);
    expect(isCloudflareKvConfigured("account", "ns", "")).toBe(false);
    expect(isCloudflareKvConfigured("  account  ", "  ns  ", "  token  ")).toBe(true);
  });
});
