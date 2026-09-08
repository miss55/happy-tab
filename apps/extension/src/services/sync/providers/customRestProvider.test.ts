import { afterEach, describe, expect, it, vi } from "vitest";
import { getDefaultSyncConfig } from "@/storage/syncStorage";
import {
  HttpsEndpointRequiredError,
  isHttpsUrl,
  requireHttpsCustomRestEndpoint
} from "../customRestSetup";
import { CustomRestProvider } from "./customRestProvider";

function makeConfig(endpointUrl: string) {
  const config = getDefaultSyncConfig();
  config.provider = "custom_rest";
  config.customRest = { endpointUrl, headersJson: "" };
  return config;
}

describe("custom REST HTTPS requirement", () => {
  it("accepts https URLs and rejects other protocols", () => {
    expect(isHttpsUrl("https://sync.example.com/snapshot")).toBe(true);
    expect(isHttpsUrl("  https://sync.example.com/snapshot  ")).toBe(true);
    expect(isHttpsUrl("http://sync.example.com/snapshot")).toBe(false);
    expect(isHttpsUrl("ftp://sync.example.com/snapshot")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("")).toBe(false);
  });

  it("throws a typed error for non-HTTPS endpoints", () => {
    expect(() => requireHttpsCustomRestEndpoint("http://example.com")).toThrow(
      HttpsEndpointRequiredError
    );
  });
});

describe("CustomRestProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not fetch when the endpoint is not HTTPS", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider = new CustomRestProvider();
    const config = makeConfig("http://example.com/snapshot");

    await expect(provider.testConnection(config)).rejects.toBeInstanceOf(HttpsEndpointRequiredError);
    await expect(provider.pullSnapshot(config)).rejects.toBeInstanceOf(HttpsEndpointRequiredError);
    await expect(provider.pushSnapshot(config, {
      version: 1,
      updated_at: "2026-08-31T00:00:00.000Z",
      data: { link_groups: [], links: [], todos: [] }
    })).rejects.toBeInstanceOf(HttpsEndpointRequiredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tests an HTTPS endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new CustomRestProvider();

    await expect(provider.testConnection(makeConfig("https://sync.example.com/snapshot"))).resolves.toBe(
      true
    );
    expect(fetchMock).toHaveBeenCalledWith("https://sync.example.com/snapshot", expect.any(Object));
  });
});
