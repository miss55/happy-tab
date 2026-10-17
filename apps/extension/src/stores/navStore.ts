import { defineStore } from "pinia";
import { messageKeyFromError } from "@/i18n";
import type { MessageKey } from "@/i18n/messages";
import {
  createNavShortcut,
  listNavShortcuts,
  reorderNavShortcuts,
  restoreNavShortcut,
  softDeleteNavShortcut,
  updateNavShortcut
} from "@/repositories/navShortcutsRepository";
import type { CreateNavShortcutInput, NavShortcut, UpdateNavShortcutInput } from "@/types/navShortcuts";

interface NavState {
  shortcuts: NavShortcut[];
  isLoading: boolean;
  errorMessage: MessageKey | "";
}

export const useNavStore = defineStore("nav", {
  state: (): NavState => ({
    shortcuts: [],
    isLoading: false,
    errorMessage: ""
  }),

  actions: {
    async loadShortcuts() {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        this.shortcuts = await listNavShortcuts();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.loadNav");
      } finally {
        this.isLoading = false;
      }
    },

    async addShortcut(input: CreateNavShortcutInput) {
      this.errorMessage = "";

      try {
        const shortcut = await createNavShortcut(input);
        await this.loadShortcuts();
        return shortcut;
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.createNav");
        throw error;
      }
    },

    async editShortcut(input: UpdateNavShortcutInput) {
      this.errorMessage = "";

      try {
        await updateNavShortcut(input);
        await this.loadShortcuts();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.updateNav");
        throw error;
      }
    },

    async removeShortcut(shortcutId: string) {
      this.errorMessage = "";

      try {
        await softDeleteNavShortcut(shortcutId);
        await this.loadShortcuts();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.deleteNav");
        throw error;
      }
    },

    async restoreShortcut(shortcutId: string) {
      this.errorMessage = "";
      try {
        await restoreNavShortcut(shortcutId);
        await this.loadShortcuts();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.updateNav");
        throw error;
      }
    },

    async sortShortcuts(shortcutIds: string[]) {
      this.errorMessage = "";

      try {
        await reorderNavShortcuts(shortcutIds);
        await this.loadShortcuts();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.sortNav");
        throw error;
      }
    },

    async openShortcut(shortcut: NavShortcut, options?: { active?: boolean }) {
      const active = options?.active !== false;

      if (typeof chrome !== "undefined" && chrome.tabs?.create) {
        await chrome.tabs.create({ url: shortcut.url, active });
        return;
      }

      window.open(shortcut.url, "_blank", "noopener");
    }
  }
});
