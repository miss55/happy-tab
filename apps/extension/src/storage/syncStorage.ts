import type { SyncProviderConfig } from "@/services/sync/types";

const SYNC_STORAGE_KEY = "happy_tab_sync_config";

const hasChromeStorage = () => typeof chrome !== "undefined" && Boolean(chrome.storage?.local);

export const getDefaultSyncConfig = (): SyncProviderConfig => ({
  provider: "jsonbin",
  enabled: false,
  autoSync: false,
  syncIntervalMinutes: 15,
  jsonbin: { apiKey: "", binId: "" },
  gist: { token: "", gistId: "", filename: "happy_tab_sync.json" },
  cloudflareKv: { accountId: "", namespaceId: "", apiToken: "", keyName: "happy_tab_sync_snapshot" },
  upstashRedis: { url: "", token: "", keyName: "happy_tab_sync_snapshot" },
  customRest: { endpointUrl: "", headersJson: "" }
});

export const getSyncConfig = async (): Promise<SyncProviderConfig> => {
  const defaults = getDefaultSyncConfig();
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(SYNC_STORAGE_KEY);
    const stored = result[SYNC_STORAGE_KEY] as Partial<SyncProviderConfig> | undefined;
    return { ...defaults, ...stored };
  }

  const rawValue = window.localStorage.getItem(SYNC_STORAGE_KEY);
  const stored = rawValue ? (JSON.parse(rawValue) as Partial<SyncProviderConfig>) : {};
  return { ...defaults, ...stored };
};

export const saveSyncConfig = async (config: SyncProviderConfig): Promise<void> => {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [SYNC_STORAGE_KEY]: config });
    return;
  }

  window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(config));
};
