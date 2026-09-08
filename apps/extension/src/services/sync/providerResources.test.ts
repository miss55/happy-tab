import { describe, expect, it } from "vitest";
import { providerResources } from "@/services/sync/providerResources";

describe("providerResources", () => {
  it("provides secure official and integration links for hosted sync providers", () => {
    for (const provider of ["jsonbin", "gist", "cloudflare_kv", "upstash_redis"] as const) {
      expect(providerResources[provider].officialUrl).toMatch(/^https:\/\//);
      expect(providerResources[provider].documentationUrl).toMatch(/^https:\/\//);
    }
  });

  it("does not claim a third-party website for a custom REST endpoint", () => {
    expect(providerResources.custom_rest).toEqual({});
  });
});
