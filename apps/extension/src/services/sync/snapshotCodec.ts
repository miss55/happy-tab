import type { SyncSnapshot } from "./types";
import { decryptPayload } from "./encryption";

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

export const parseStoredSnapshot = async (
  rawResult: unknown,
  encryptionKey?: string
): Promise<SyncSnapshot | null> => {
  if (rawResult == null || rawResult === "") return null;

  let payloadStr: string;
  if (typeof rawResult === "string") {
    payloadStr = rawResult;
  } else if (isValidSyncSnapshot(rawResult)) {
    return rawResult;
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
    return isValidSyncSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
