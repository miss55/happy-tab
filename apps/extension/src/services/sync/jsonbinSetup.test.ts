import { describe, expect, it } from "vitest";
import {
  JSONBIN_API_KEYS_URL,
  JSONBIN_BINS_URL,
  JSONBIN_PLACEHOLDER_JSON,
  JSONBIN_PLACEHOLDER_SNAPSHOT,
  isJsonBinConfigured
} from "./jsonbinSetup";

describe("jsonbinSetup", () => {
  it("points setup links at HTTPS JSONBin app pages", () => {
    expect(JSONBIN_API_KEYS_URL).toBe("https://jsonbin.io/app/app/api-keys");
    expect(JSONBIN_BINS_URL).toBe("https://jsonbin.io/app/bins");
  });

  it("exports the empty snapshot JSON used when creating a Bin", () => {
    expect(JSON.parse(JSONBIN_PLACEHOLDER_JSON)).toEqual(JSONBIN_PLACEHOLDER_SNAPSHOT);
    expect(JSONBIN_PLACEHOLDER_SNAPSHOT.data).toEqual({
      link_groups: [],
      links: [],
      todos: [],
      usage_stats: []
    });
  });

  it("treats JSONBin as configured only when Access Key and Bin ID are both present", () => {
    expect(isJsonBinConfigured("", "bin")).toBe(false);
    expect(isJsonBinConfigured("key", "")).toBe(false);
    expect(isJsonBinConfigured("  key  ", "  bin  ")).toBe(true);
  });
});
