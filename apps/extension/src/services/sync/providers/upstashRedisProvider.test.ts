import { afterEach, describe, expect, it, vi } from "vitest";
import { getDefaultSyncConfig } from "@/storage/syncStorage";
import { PLACEHOLDER_SYNC_SNAPSHOT } from "../placeholderSnapshot";
import { UpstashRedisProvider } from "./upstashRedisProvider";

function makeConfig() {
  const config = getDefaultSyncConfig();
  config.provider = "upstash_redis";
  config.upstashRedis = {
    url: "https://wired-meerkat-234187.upstash.io/",
    token: " upstash-token ",
    keyName: "happy_tab_sync_snapshot"
  };
  return config;
}

function jsonResponse(result: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    json: async () => ({ result })
  };
}

describe("UpstashRedisProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("pings Upstash to test the connection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse("PONG"));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new UpstashRedisProvider();
    await expect(provider.testConnection(makeConfig())).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith("https://wired-meerkat-234187.upstash.io", {
      method: "POST",
      headers: {
        Authorization: "Bearer upstash-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(["PING"])
    });
  });

  it("treats a missing Redis key as no remote snapshot so sync can create it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(0));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new UpstashRedisProvider();
    await expect(provider.pullSnapshot(makeConfig())).resolves.toBeNull();
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual([
      "EXISTS",
      "happy_tab_sync_snapshot"
    ]);
  });

  it("treats an empty or invalid stored value as missing so the key can be created", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(1))
      .mockResolvedValueOnce(jsonResponse("{}"));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new UpstashRedisProvider();
    await expect(provider.pullSnapshot(makeConfig())).resolves.toBeNull();
  });

  it("creates the snapshot key with SET when pushing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse("OK"));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new UpstashRedisProvider();
    await expect(provider.pushSnapshot(makeConfig(), PLACEHOLDER_SYNC_SNAPSHOT)).resolves.toBe(true);

    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual([
      "SET",
      "happy_tab_sync_snapshot",
      JSON.stringify(PLACEHOLDER_SYNC_SNAPSHOT)
    ]);
  });
});
