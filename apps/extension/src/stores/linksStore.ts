import { defineStore } from "pinia";
import { messageKeyFromError } from "@/i18n";
import type { MessageKey } from "@/i18n/messages";
import {
  createLink,
  createLinkGroup,
  ensureDefaultLinkGroup,
  incrementLinkOpenStats,
  listLinkGroupsWithLinks,
  reorderLinkGroups,
  reorderLinks,
  softDeleteLink,
  softDeleteLinkGroup,
  updateLink,
  updateLinkGroup
} from "@/repositories/linksRepository";
import type { BrowserTab } from "@/types/browserTabs";
import type { CreateLinkInput, Link, LinkGroupWithLinks, ReorderLinksInput, UpdateLinkInput } from "@/types/links";

export const browserTabToLinkInput = (tab: BrowserTab, groupId: string): CreateLinkInput => ({
  group_id: groupId,
  title: tab.title,
  url: tab.url,
  favicon_url: tab.favIconUrl,
  source: "browser_tab"
});

interface LinksState {
  groups: LinkGroupWithLinks[];
  isLoading: boolean;
  errorMessage: MessageKey | "";
}

export const useLinksStore = defineStore("links", {
  state: (): LinksState => ({
    groups: [],
    isLoading: false,
    errorMessage: ""
  }),

  getters: {
    defaultGroupId: (state) => state.groups[0]?.id || "",
    linkCount: (state) => state.groups.reduce((count, group) => count + group.links.length, 0)
  },

  actions: {
    async loadLinks() {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        await ensureDefaultLinkGroup();
        this.groups = await listLinkGroupsWithLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.loadLinks");
      } finally {
        this.isLoading = false;
      }
    },

    async addGroup(name: string) {
      this.errorMessage = "";

      try {
        const group = await createLinkGroup({ name });
        await this.loadLinks();
        return group;
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.createGroup");
        throw error;
      }
    },

    async addLink(input: CreateLinkInput) {
      this.errorMessage = "";

      try {
        const link = await createLink(input);
        await this.loadLinks();
        return link;
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.createLink");
        throw error;
      }
    },

    async saveBrowserTab(tab: BrowserTab, groupId: string) {
      return this.addLink(browserTabToLinkInput(tab, groupId));
    },

    async renameGroup(groupId: string, name: string) {
      this.errorMessage = "";

      try {
        await updateLinkGroup({ id: groupId, name });
        await this.loadLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.renameGroup");
        throw error;
      }
    },

    async deleteGroup(groupId: string) {
      this.errorMessage = "";

      try {
        await softDeleteLinkGroup(groupId);
        await this.loadLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.deleteGroup");
        throw error;
      }
    },

    async editLink(input: UpdateLinkInput) {
      this.errorMessage = "";

      try {
        await updateLink(input);
        await this.loadLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.updateLink");
        throw error;
      }
    },

    async deleteLink(linkId: string) {
      this.errorMessage = "";

      try {
        await softDeleteLink(linkId);
        await this.loadLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.deleteLink");
        throw error;
      }
    },

    async sortGroups(groupIds: string[]) {
      this.errorMessage = "";

      try {
        await reorderLinkGroups({ group_ids: groupIds });
        await this.loadLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.sortGroups");
        throw error;
      }
    },

    async sortLinks(groups: ReorderLinksInput["groups"]) {
      this.errorMessage = "";

      try {
        await reorderLinks({ groups });
        await this.loadLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.sortLinks");
        throw error;
      }
    },

    async openLink(link: Link) {
      await incrementLinkOpenStats(link.id);
      await this.loadLinks();

      if (typeof chrome !== "undefined" && chrome.tabs?.create) {
        await chrome.tabs.create({ url: link.url });
        return;
      }

      window.open(link.url, "_blank", "noopener");
    }
  }
});
