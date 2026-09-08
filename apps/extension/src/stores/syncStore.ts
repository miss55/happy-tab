import { defineStore } from "pinia";
import type { MessageKey } from "@/i18n/messages";
import { getDefaultSyncConfig, getSyncConfig, saveSyncConfig } from "@/storage/syncStorage";
import { messageKeyFromSyncError, performSync, testProviderConnection } from "@/services/sync/syncManager";
import type { SyncProviderConfig, SyncResult } from "@/services/sync/types";

export interface SyncStoreState {
  config: SyncProviderConfig;
  isSyncing: boolean;
  isTesting: boolean;
  lastResult: SyncResult | null;
  testStatus: { success: boolean; message: MessageKey } | null;
}

export const useSyncStore = defineStore("sync", {
  state: (): SyncStoreState => ({
    config: getDefaultSyncConfig(),
    isSyncing: false,
    isTesting: false,
    lastResult: null,
    testStatus: null
  }),

  actions: {
    async loadConfig() {
      this.config = await getSyncConfig();
    },

    async updateConfig(newConfig: Partial<SyncProviderConfig>) {
      this.config = {
        ...this.config,
        ...newConfig
      };
      await saveSyncConfig(this.config);
    },

    async testConnection(): Promise<boolean> {
      this.isTesting = true;
      this.testStatus = null;
      try {
        const success = await testProviderConnection(this.config);
        this.testStatus = {
          success,
          message: success ? "cloud.testSuccess" : "cloud.testFailed"
        };
        return success;
      } catch (error) {
        this.testStatus = {
          success: false,
          message: messageKeyFromSyncError(error, "cloud.testFailed")
        };
        return false;
      } finally {
        this.isTesting = false;
      }
    },

    async triggerSync(): Promise<SyncResult> {
      if (!this.config.enabled) {
        const result: SyncResult = { success: false, mode: "error", message: "cloud.syncDisabled" };
        this.lastResult = result;
        return result;
      }

      this.isSyncing = true;
      try {
        const result = await performSync(this.config);
        this.lastResult = result;
        if (result.success) {
          this.config.lastSyncTime = new Date().toISOString();
          await saveSyncConfig(this.config);
        }
        return result;
      } finally {
        this.isSyncing = false;
      }
    }
  }
});
