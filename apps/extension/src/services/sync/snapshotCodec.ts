import type { SyncSnapshot } from "./types";
import { decryptPayload, SyncDecryptError } from "./encryption";

export class SyncSnapshotVersionError extends Error {
  constructor() { super("pages.syncIncompatible"); }
}

export const assertSupportedSnapshot = (snapshot: SyncSnapshot) => {
  if ((snapshot.version !== 1 && snapshot.version !== 2) || !snapshot.data ||
      !Array.isArray(snapshot.data.link_groups) || !Array.isArray(snapshot.data.links) ||
      !Array.isArray(snapshot.data.todos) ||
      (snapshot.version === 2 && !Array.isArray(snapshot.data.bookmark_pages))) {
    throw new SyncSnapshotVersionError();
  }
  if (snapshot.data.bookmark_pages !== undefined) {
    const pages = snapshot.data.bookmark_pages;
    if (!Array.isArray(pages) || pages.some(page => !page || typeof page.id !== "string" || !page.id ||
      typeof page.name !== "string" || !Number.isInteger(page.sort_order) || page.sort_order < 0 ||
      !Number.isFinite(Date.parse(page.created_at)) || !Number.isFinite(Date.parse(page.updated_at)) ||
      (page.deleted_at !== undefined && !Number.isFinite(Date.parse(page.deleted_at)))) ||
      new Set(pages.map(page => page.id)).size !== pages.length) throw new SyncSnapshotVersionError();
  }
};

export const isValidSyncSnapshot = (value: unknown): value is SyncSnapshot => {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<SyncSnapshot>;
  return Boolean(
    snapshot.data &&
      Array.isArray(snapshot.data.link_groups) &&
      Array.isArray(snapshot.data.links) &&
      Array.isArray(snapshot.data.todos)
  );
};

const validateStoredSnapshot = (value: unknown): SyncSnapshot | null => {
  // An advertised snapshot must never be mistaken for an empty remote store.
  if (isValidSyncSnapshot(value) || (value && typeof value === "object" && "version" in value)) {
    assertSupportedSnapshot(value as SyncSnapshot);
    return value as SyncSnapshot;
  }
  return null;
};

export const parseStoredSnapshot = async (
  rawResult: unknown,
  encryptionKey?: string
): Promise<SyncSnapshot | null> => {
  if (rawResult == null || rawResult === "") return null;

  let payloadStr: string;
  if (typeof rawResult === "string") {
    payloadStr = rawResult;
  } else if (rawResult && typeof rawResult === "object" && "version" in rawResult) {
    return validateStoredSnapshot(rawResult);
  } else if (
    typeof rawResult === "object" &&
    rawResult !== null &&
    "encryptedPayload" in rawResult &&
    typeof (rawResult as { encryptedPayload?: unknown }).encryptedPayload === "string"
  ) {
    payloadStr = (rawResult as { encryptedPayload: string }).encryptedPayload;
  } else {
    payloadStr = JSON.stringify(rawResult);
  }

  try {
    const decryptedStr = await decryptPayload(payloadStr, encryptionKey);
    const parsed: unknown = JSON.parse(decryptedStr);
    return validateStoredSnapshot(parsed);
  } catch (error) {
    if (error instanceof SyncDecryptError || error instanceof SyncSnapshotVersionError) {
      throw error;
    }
    return null;
  }
};
