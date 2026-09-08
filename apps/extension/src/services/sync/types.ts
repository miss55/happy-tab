import type { MessageKey } from "@/i18n/messages";
import type { LinkGroup, SavedLink } from "@/types/links";
import type { TodoItem } from "@/types/todos";
import type { UsageStat } from "@/types/usageStats";

export type ProviderType =
  | "jsonbin"
  | "gist"
  | "cloudflare_kv"
  | "upstash_redis"
  | "custom_rest";

export interface SyncSnapshot {
  version: number;
  updated_at: string;
  device_name?: string;
  data: {
    link_groups: LinkGroup[];
    links: SavedLink[];
    todos: TodoItem[];
    usage_stats?: UsageStat[];
  };
}

export interface JsonBinConfig {
  apiKey: string;
  binId: string;
}

export interface GistConfig {
  token: string;
  gistId: string;
  filename?: string;
}

export interface CloudflareKvConfig {
  accountId: string;
  namespaceId: string;
  apiToken: string;
  keyName: string;
}

export interface UpstashRedisConfig {
  url: string;
  token: string;
  keyName: string;
}

export interface CustomRestConfig {
  endpointUrl: string;
  headersJson?: string;
}

export interface SyncProviderConfig {
  provider: ProviderType;
  enabled: boolean;
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncTime?: string;
  encryptionKey?: string;

  jsonbin: JsonBinConfig;
  gist: GistConfig;
  cloudflareKv: CloudflareKvConfig;
  upstashRedis: UpstashRedisConfig;
  customRest: CustomRestConfig;
}

export interface StorageProvider {
  type: ProviderType;
  name: string;
  testConnection(config: SyncProviderConfig): Promise<boolean>;
  pullSnapshot(config: SyncProviderConfig): Promise<SyncSnapshot | null>;
  pushSnapshot(config: SyncProviderConfig, snapshot: SyncSnapshot): Promise<boolean>;
}

export interface SyncResult {
  success: boolean;
  mode: "pushed" | "pulled" | "in_sync" | "error";
  message?: MessageKey;
  pulledCount?: {
    link_groups: number;
    links: number;
    todos: number;
  };
}
