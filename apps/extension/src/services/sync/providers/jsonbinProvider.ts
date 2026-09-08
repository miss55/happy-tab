import type { StorageProvider, SyncProviderConfig, SyncSnapshot } from "../types";
import { decryptPayload, encryptPayload } from "../encryption";

export function jsonBinAuthHeaders(apiKey: string): Record<string, string> {
  return {
    "X-Access-Key": apiKey.trim()
  };
}

export class JsonBinProvider implements StorageProvider {
  readonly type = "jsonbin";
  readonly name = "JSONBin.io";

  private getUrl(binId: string): string {
    return `https://api.jsonbin.io/v3/b/${binId.trim()}`;
  }

  async testConnection(config: SyncProviderConfig): Promise<boolean> {
    const { apiKey, binId } = config.jsonbin;
    if (!apiKey || !binId) return false;

    try {
      const response = await fetch(`${this.getUrl(binId)}/latest`, {
        method: "GET",
        headers: jsonBinAuthHeaders(apiKey)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullSnapshot(config: SyncProviderConfig): Promise<SyncSnapshot | null> {
    const { apiKey, binId } = config.jsonbin;
    if (!apiKey || !binId) throw new Error("JSONBin API key and Bin ID are required.");

    const response = await fetch(`${this.getUrl(binId)}/latest`, {
      method: "GET",
      headers: jsonBinAuthHeaders(apiKey)
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`JSONBin pull failed with status ${response.status}`);
    }

    const resJson = await response.json();
    const rawRecord = resJson.record;

    if (!rawRecord) return null;

    let payloadString: string;
    if (typeof rawRecord === "string") {
      payloadString = rawRecord;
    } else if (rawRecord.version && rawRecord.data) {
      return rawRecord as SyncSnapshot;
    } else if (rawRecord.encryptedPayload) {
      payloadString = rawRecord.encryptedPayload;
    } else {
      payloadString = JSON.stringify(rawRecord);
    }

    const decryptedStr = await decryptPayload(payloadString, config.encryptionKey);
    return JSON.parse(decryptedStr) as SyncSnapshot;
  }

  async pushSnapshot(config: SyncProviderConfig, snapshot: SyncSnapshot): Promise<boolean> {
    const { apiKey, binId } = config.jsonbin;
    if (!apiKey || !binId) throw new Error("JSONBin API key and Bin ID are required.");

    const jsonStr = JSON.stringify(snapshot);
    const payloadStr = await encryptPayload(jsonStr, config.encryptionKey);

    const bodyContent = payloadStr.startsWith("enc:v1:")
      ? JSON.stringify({ encryptedPayload: payloadStr })
      : payloadStr;

    const response = await fetch(this.getUrl(binId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...jsonBinAuthHeaders(apiKey)
      },
      body: bodyContent
    });

    return response.ok;
  }
}
