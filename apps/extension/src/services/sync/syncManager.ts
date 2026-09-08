import { happyTabDb } from "@/db/happyTabDb";
import type { MessageKey } from "@/i18n/messages";
import type { LinkGroup, SavedLink } from "@/types/links";
import type { TodoItem } from "@/types/todos";
import type { UsageStat } from "@/types/usageStats";

import { isCloudflareKvConfigured } from "./cloudflareSetup";
import {
  CloudflareHostPermissionDeniedError,
  requireCloudflareHostPermission
} from "./cloudflareHostPermission";
import { HttpsEndpointRequiredError } from "./customRestSetup";
import { mergeSnapshots } from "./mergeEngine";
import { getStorageProvider } from "./providers";
import type { SyncProviderConfig, SyncResult, SyncSnapshot } from "./types";

const ensureProviderAccess = async (config: SyncProviderConfig): Promise<void> => {
  if (
    config.provider === "cloudflare_kv" &&
    isCloudflareKvConfigured(
      config.cloudflareKv.accountId,
      config.cloudflareKv.namespaceId,
      config.cloudflareKv.apiToken
    )
  ) {
    await requireCloudflareHostPermission();
  }
};

export const messageKeyFromSyncError = (error: unknown, fallback: MessageKey): MessageKey => {
  if (error instanceof CloudflareHostPermissionDeniedError) {
    return "cloud.cfPermissionDenied";
  }
  if (error instanceof HttpsEndpointRequiredError) {
    return "cloud.httpsRequired";
  }
  return fallback;
};

export const buildLocalSnapshot = async (): Promise<SyncSnapshot> => {
  const [link_groups, links, todos, usage_stats] = await Promise.all([
    happyTabDb.link_groups.toArray(),
    happyTabDb.links.toArray(),
    happyTabDb.todos.toArray(),
    happyTabDb.usage_stats.toArray()
  ]);

  return {
    version: 1,
    updated_at: new Date().toISOString(),
    data: {
      link_groups,
      links,
      todos,
      usage_stats
    }
  };
};

export const applyMergedSnapshotToDb = async (merged: {
  link_groups: LinkGroup[];
  links: SavedLink[];
  todos: TodoItem[];
  usage_stats?: UsageStat[];
}): Promise<void> => {
  await happyTabDb.transaction(
    "rw",
    [happyTabDb.link_groups, happyTabDb.links, happyTabDb.todos, happyTabDb.usage_stats],
    async () => {
      if (merged.link_groups.length > 0) {
        await happyTabDb.link_groups.bulkPut(merged.link_groups);
      }
      if (merged.links.length > 0) {
        await happyTabDb.links.bulkPut(merged.links);
      }
      if (merged.todos.length > 0) {
        await happyTabDb.todos.bulkPut(merged.todos);
      }
      if (merged.usage_stats && merged.usage_stats.length > 0) {
        await happyTabDb.usage_stats.bulkPut(merged.usage_stats);
      }
    }
  );
};

export const testProviderConnection = async (config: SyncProviderConfig): Promise<boolean> => {
  await ensureProviderAccess(config);
  const provider = getStorageProvider(config.provider);
  return provider.testConnection(config);
};

export const performSync = async (config: SyncProviderConfig): Promise<SyncResult> => {
  if (!config.enabled) {
    return { success: false, mode: "error", message: "cloud.syncDisabled" };
  }

  try {
    await ensureProviderAccess(config);
    const provider = getStorageProvider(config.provider);
    const localSnapshot = await buildLocalSnapshot();
    const remoteSnapshot = await provider.pullSnapshot(config);

    if (!remoteSnapshot) {
      const pushed = await provider.pushSnapshot(config, localSnapshot);
      if (!pushed) {
        return { success: false, mode: "error", message: "cloud.pushInitialFailed" };
      }
      return {
        success: true,
        mode: "pushed",
        message: "cloud.pushInitialSuccess"
      };
    }

    const mergedData = mergeSnapshots(
      {
        link_groups: localSnapshot.data.link_groups,
        links: localSnapshot.data.links,
        todos: localSnapshot.data.todos
      },
      remoteSnapshot
    );

    await applyMergedSnapshotToDb(mergedData);

    const newSnapshot: SyncSnapshot = {
      version: 1,
      updated_at: new Date().toISOString(),
      data: {
        ...mergedData,
        usage_stats: localSnapshot.data.usage_stats
      }
    };

    const pushSuccess = await provider.pushSnapshot(config, newSnapshot);

    return {
      success: pushSuccess,
      mode: pushSuccess ? "pulled" : "error",
      message: pushSuccess ? "cloud.syncSuccess" : "cloud.pushMergedFailed",
      pulledCount: {
        link_groups: mergedData.link_groups.length,
        links: mergedData.links.length,
        todos: mergedData.todos.length
      }
    };
  } catch (error) {
    return {
      success: false,
      mode: "error",
      message: messageKeyFromSyncError(error, "cloud.unexpectedError")
    };
  }
};
