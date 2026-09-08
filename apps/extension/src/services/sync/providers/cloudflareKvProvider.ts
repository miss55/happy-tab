import { extensionFetch } from "@/services/extensionFetch";
import type { StorageProvider, SyncProviderConfig, SyncSnapshot } from "../types";
import { encryptPayload } from "../encryption";
import { parseStoredSnapshot } from "../snapshotCodec";

const DEFAULT_KEY_NAME = "happy_tab_sync_snapshot";

export class CloudflareKvProvider implements StorageProvider {
  readonly type = "cloudflare_kv";
  readonly name = "Cloudflare KV";

  private getUrl(config: SyncProviderConfig): string {
    const { accountId, namespaceId, keyName } = config.cloudflareKv;
    const key = keyName?.trim() || DEFAULT_KEY_NAME;
    return `https://api.cloudflare.com/client/v4/accounts/${accountId.trim()}/storage/kv/namespaces/${namespaceId.trim()}/values/${encodeURIComponent(key)}`;
  }

  async testConnection(config: SyncProviderConfig): Promise<boolean> {
    const { accountId, namespaceId, apiToken } = config.cloudflareKv;
    if (!accountId || !namespaceId || !apiToken) return false;

    try {
      const response = await extensionFetch(this.getUrl(config), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken.trim()}`
        }
      });
      return response.ok || response.status === 404;
    } catch {
      return false;
    }
  }

  async pullSnapshot(config: SyncProviderConfig): Promise<SyncSnapshot | null> {
    const { accountId, namespaceId, apiToken } = config.cloudflareKv;
    if (!accountId || !namespaceId || !apiToken) {
      throw new Error("Cloudflare Account ID, Namespace ID, and API Token are required.");
    }

    const response = await extensionFetch(this.getUrl(config), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken.trim()}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Cloudflare KV pull failed with status ${response.status}`);
    }

    const rawText = await response.text();
    return parseStoredSnapshot(rawText, config.encryptionKey);
  }

  async pushSnapshot(config: SyncProviderConfig, snapshot: SyncSnapshot): Promise<boolean> {
    const { accountId, namespaceId, apiToken } = config.cloudflareKv;
    if (!accountId || !namespaceId || !apiToken) {
      throw new Error("Cloudflare Account ID, Namespace ID, and API Token are required.");
    }

    const jsonStr = JSON.stringify(snapshot);
    const payloadContent = await encryptPayload(jsonStr, config.encryptionKey);

    const response = await extensionFetch(this.getUrl(config), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken.trim()}`,
        "Content-Type": "text/plain; charset=utf-8"
      },
      body: payloadContent
    });

    return response.ok;
  }
}
