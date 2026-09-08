import type { StorageProvider, SyncProviderConfig, SyncSnapshot } from "../types";
import { encryptPayload } from "../encryption";
import { parseStoredSnapshot } from "../snapshotCodec";

const DEFAULT_KEY_NAME = "happy_tab_sync_snapshot";

interface UpstashResponse {
  result?: unknown;
  error?: string;
}

export class UpstashRedisProvider implements StorageProvider {
  readonly type = "upstash_redis";
  readonly name = "Upstash Redis";

  private getBaseUrl(url: string): string {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl;
  }

  private getKeyName(config: SyncProviderConfig): string {
    return config.upstashRedis.keyName?.trim() || DEFAULT_KEY_NAME;
  }

  private async sendCommand(
    config: SyncProviderConfig,
    command: Array<string>
  ): Promise<UpstashResponse> {
    const { url, token } = config.upstashRedis;
    const response = await fetch(this.getBaseUrl(url), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(command)
    });

    const payload = (await response.json()) as UpstashResponse;
    if (!response.ok || payload.error) {
      throw new Error(payload.error || `Upstash Redis command failed with status ${response.status}`);
    }
    return payload;
  }

  async testConnection(config: SyncProviderConfig): Promise<boolean> {
    const { url, token } = config.upstashRedis;
    if (!url || !token) return false;

    try {
      const payload = await this.sendCommand(config, ["PING"]);
      return payload.result === "PONG";
    } catch {
      return false;
    }
  }

  async pullSnapshot(config: SyncProviderConfig): Promise<SyncSnapshot | null> {
    const { url, token } = config.upstashRedis;
    if (!url || !token) throw new Error("Upstash Redis REST URL and Token are required.");

    const key = this.getKeyName(config);
    const existsPayload = await this.sendCommand(config, ["EXISTS", key]);
    if (!existsPayload.result) return null;

    const getPayload = await this.sendCommand(config, ["GET", key]);
    return parseStoredSnapshot(getPayload.result, config.encryptionKey);
  }

  async pushSnapshot(config: SyncProviderConfig, snapshot: SyncSnapshot): Promise<boolean> {
    const { url, token } = config.upstashRedis;
    if (!url || !token) throw new Error("Upstash Redis REST URL and Token are required.");

    const jsonStr = JSON.stringify(snapshot);
    const payloadContent = await encryptPayload(jsonStr, config.encryptionKey);
    const key = this.getKeyName(config);
    const payload = await this.sendCommand(config, ["SET", key, payloadContent]);
    return payload.result === "OK";
  }
}
