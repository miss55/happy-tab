import { afterEach, describe, expect, it, vi } from "vitest";
import { getDefaultSyncConfig } from "@/storage/syncStorage";
import { jsonBinAuthHeaders, JsonBinProvider } from "./jsonbinProvider";

function makeConfig() {
  const config = getDefaultSyncConfig();
  config.jsonbin = { apiKey: "  access-key-value  ", binId: "6a92f8fcf5f4af" };
  return config;
}

describe("jsonBinAuthHeaders", () => {
  it("sends X-Access-Key and never includes X-Master-Key", () => {
    expect(jsonBinAuthHeaders("  access-key-value  ")).toEqual({
      "X-Access-Key": "access-key-value"
    });
  });
});

describe("JsonBinProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("tests the connection with X-Access-Key only", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new JsonBinProvider();
    await expect(provider.testConnection(makeConfig())).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({ "X-Access-Key": "access-key-value" });
  });

  it("pulls and pushes snapshots with X-Access-Key only", async () => {
    const snapshot = {
      version: 1,
      updated_at: "2026-08-29T00:00:00.000Z",
      data: { link_groups: [], links: [], todos: [] }
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ record: snapshot })
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new JsonBinProvider();
    const config = makeConfig();

    await expect(provider.pullSnapshot(config)).resolves.toEqual(snapshot);
    await expect(provider.pushSnapshot(config, snapshot)).resolves.toBe(true);

    const pullHeaders = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const pushHeaders = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;

    expect(pullHeaders["X-Access-Key"]).toBe("access-key-value");
    expect(pullHeaders["X-Master-Key"]).toBeUndefined();
    expect(pushHeaders["X-Access-Key"]).toBe("access-key-value");
    expect(pushHeaders["X-Master-Key"]).toBeUndefined();
  });
});
