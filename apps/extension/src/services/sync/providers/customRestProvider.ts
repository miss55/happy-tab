import { requireHttpsCustomRestEndpoint } from "../customRestSetup";
import { decryptPayload, encryptPayload } from "../encryption";
import type { StorageProvider, SyncProviderConfig, SyncSnapshot } from "../types";

export class CustomRestProvider implements StorageProvider {
  readonly type = "custom_rest";
  readonly name = "Custom REST API";

  private parseCustomHeaders(headersJson?: string): Record<string, string> {
    if (!headersJson || headersJson.trim() === "") return {};
    try {
      return JSON.parse(headersJson);
    } catch {
      return {};
    }
  }

  async testConnection(config: SyncProviderConfig): Promise<boolean> {
    const { endpointUrl, headersJson } = config.customRest;
    if (!endpointUrl) return false;
    requireHttpsCustomRestEndpoint(endpointUrl);

    try {
      const response = await fetch(endpointUrl.trim(), {
        method: "GET",
        headers: this.parseCustomHeaders(headersJson)
      });
      return response.ok || response.status === 404;
    } catch {
      return false;
    }
  }

  async pullSnapshot(config: SyncProviderConfig): Promise<SyncSnapshot | null> {
    const { endpointUrl, headersJson } = config.customRest;
    if (!endpointUrl) throw new Error("Custom REST endpoint URL is required.");
    requireHttpsCustomRestEndpoint(endpointUrl);

    const response = await fetch(endpointUrl.trim(), {
      method: "GET",
      headers: this.parseCustomHeaders(headersJson)
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Custom REST GET failed with status ${response.status}`);
    }

    const rawText = await response.text();
    if (!rawText || rawText.trim() === "") return null;

    let payloadStr = rawText;
    try {
      const parsedObj = JSON.parse(rawText);
      if (parsedObj.version && parsedObj.data) {
        return parsedObj as SyncSnapshot;
      }
      if (parsedObj.data && typeof parsedObj.data === "string") {
        payloadStr = parsedObj.data;
      }
    } catch {
      // payloadStr is plain text/encrypted string
    }

    const decryptedStr = await decryptPayload(payloadStr, config.encryptionKey);
    return JSON.parse(decryptedStr) as SyncSnapshot;
  }

  async pushSnapshot(config: SyncProviderConfig, snapshot: SyncSnapshot): Promise<boolean> {
    const { endpointUrl, headersJson } = config.customRest;
    if (!endpointUrl) throw new Error("Custom REST endpoint URL is required.");
    requireHttpsCustomRestEndpoint(endpointUrl);

    const jsonStr = JSON.stringify(snapshot);
    const payloadContent = await encryptPayload(jsonStr, config.encryptionKey);
    const customHeaders = this.parseCustomHeaders(headersJson);

    const isEncrypted = payloadContent.startsWith("enc:v1:");
    const response = await fetch(endpointUrl.trim(), {
      method: "PUT",
      headers: {
        "Content-Type": isEncrypted ? "text/plain" : "application/json",
        ...customHeaders
      },
      body: payloadContent
    });

    return response.ok;
  }
}
