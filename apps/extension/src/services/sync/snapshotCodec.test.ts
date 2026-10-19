import { describe, expect, it } from "vitest";
import { encryptPayload, SyncDecryptError } from "./encryption";
import { isValidSyncSnapshot, parseStoredSnapshot } from "./snapshotCodec";
import { PLACEHOLDER_SYNC_SNAPSHOT } from "./placeholderSnapshot";

describe("snapshotCodec", () => {
  it("accepts a complete sync snapshot", () => {
    expect(isValidSyncSnapshot(PLACEHOLDER_SYNC_SNAPSHOT)).toBe(true);
  });

  it("rejects missing or incomplete snapshot data", () => {
    expect(isValidSyncSnapshot(null)).toBe(false);
    expect(isValidSyncSnapshot({})).toBe(false);
    expect(isValidSyncSnapshot({ version: 1, data: {} })).toBe(false);
  });

  it("parses stored JSON and returns null for empty or invalid payloads", async () => {
    await expect(parseStoredSnapshot(null)).resolves.toBeNull();
    await expect(parseStoredSnapshot("{}")).resolves.toBeNull();
    await expect(parseStoredSnapshot(PLACEHOLDER_SYNC_SNAPSHOT)).resolves.toEqual(
      PLACEHOLDER_SYNC_SNAPSHOT
    );
    await expect(parseStoredSnapshot(JSON.stringify(PLACEHOLDER_SYNC_SNAPSHOT))).resolves.toEqual(
      PLACEHOLDER_SYNC_SNAPSHOT
    );
  });

  it("rejects an encrypted snapshot when the password is wrong and does not treat it as empty", async () => {
    const encrypted = await encryptPayload(JSON.stringify(PLACEHOLDER_SYNC_SNAPSHOT), "correct-password");

    await expect(parseStoredSnapshot(encrypted, "wrong-password")).rejects.toBeInstanceOf(SyncDecryptError);
    await expect(parseStoredSnapshot(encrypted, "")).rejects.toBeInstanceOf(SyncDecryptError);
  });
});
