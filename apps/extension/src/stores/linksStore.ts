import { defineStore } from "pinia";
import { createBookmarkPage, deleteEmptyBookmarkPage, ensureBookmarkPages, listBookmarkPages, moveLinkGroupToPage, renameBookmarkPage, reorderBookmarkPages } from "@/repositories/bookmarkPagesRepository";
import { DEFAULT_BOOKMARK_PAGE_ID, type BookmarkPage } from "@/types/bookmarkPages";
import { getLocalStorageValue, setLocalStorageValue } from "@/services/chromeStorage";
import { messageKeyFromError } from "@/i18n";
import type { MessageKey } from "@/i18n/messages";
import {
  createLink,
  createLinkGroup,
  ensureDefaultLinkGroup,
  assignMissingGroupColors,
  incrementLinkOpenStats,
  listLinkGroupsWithLinks,
  listLinkGroups,
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

export const applyLinkOrder = (
  current: LinkGroupWithLinks[],
  order: ReorderLinksInput["groups"]
): LinkGroupWithLinks[] => {
  const linkById = new Map(current.flatMap((group) => group.links).map((link) => [link.id, link]));
  const idsByGroup = new Map(order.map((group) => [group.group_id, group.link_ids]));

  return current.map((group) => {
    const linkIds = idsByGroup.get(group.id);

    if (!linkIds) {
      return group;
    }

    return {
      ...group,
      links: linkIds.flatMap((linkId) => {
        const link = linkById.get(linkId);
        return link ? [link.group_id === group.id ? link : { ...link, group_id: group.id }] : [];
      })
    };
  });
};

export const applyGroupOrder = (current: LinkGroupWithLinks[], groupIds: string[]): LinkGroupWithLinks[] => {
  const rank = new Map(groupIds.map((id, index) => [id, index]));
  return [...current].sort(
    (left, right) =>
      (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER)
  );
};

interface LinksState {
  pages: BookmarkPage[];
  activePageId: string;
  hasLoadedPages: boolean;
  groups: LinkGroupWithLinks[];
  isLoading: boolean;
  errorMessage: MessageKey | "";
}

export const useLinksStore = defineStore("links", {
  state: (): LinksState => ({
    pages: [],
    activePageId: DEFAULT_BOOKMARK_PAGE_ID,
    hasLoadedPages: false,
    groups: [],
    isLoading: false,
    errorMessage: ""
  }),

  getters: {
    currentGroups: (state) => state.groups.filter(group => (group.page_id || DEFAULT_BOOKMARK_PAGE_ID) === state.activePageId),
    defaultGroupId(): string { return this.currentGroups[0]?.id || ""; },
    linkCount(): number { return this.currentGroups.reduce((count, group) => count + group.links.length, 0); }
  },

  actions: {
    async loadLinks() {
      const showLoading = this.groups.length === 0;

      if (showLoading) {
        this.isLoading = true;
      }

      this.errorMessage = "";

      try {
        await ensureBookmarkPages();
        if (!this.hasLoadedPages) {
          const saved = await getLocalStorageValue<string>("happy_tab_active_bookmark_page").catch(() => undefined);
          if (saved) this.activePageId = saved;
        }
        this.pages = await listBookmarkPages();
        if (!this.pages.some(page => page.id === this.activePageId)) this.activePageId = DEFAULT_BOOKMARK_PAGE_ID;
        if (!this.hasLoadedPages && !(await listLinkGroups()).length) await ensureDefaultLinkGroup();
        this.hasLoadedPages = true;
        await assignMissingGroupColors();
        this.groups = await listLinkGroupsWithLinks();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.loadLinks");
      } finally {
        if (showLoading) {
          this.isLoading = false;
        }
      }
    },

    async selectPage(id: string) {
      if (!this.pages.some(page => page.id === id)) return;
      this.activePageId = id;
      try { await setLocalStorageValue("happy_tab_active_bookmark_page", id); }
      catch { this.errorMessage = "error.saveWorkspace"; }
    },

    async savePage(name: string, id?: string) {
      this.errorMessage = "";
      try {
        const page = id ? await renameBookmarkPage(id, name) : await createBookmarkPage(name);
        await this.loadLinks();
        if (page) await this.selectPage(page.id);
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "pages.saveFailed");
        throw error;
      }
    },

    async deletePage(id: string) {
      this.errorMessage = "";
      try {
        await deleteEmptyBookmarkPage(id);
        await this.loadLinks();
        await this.selectPage(this.activePageId);
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "pages.saveFailed");
        throw error;
      }
    },

    async sortPages(ids: string[]) {
      this.errorMessage = "";
      try { await reorderBookmarkPages(ids); await this.loadLinks(); }
      catch (error) { this.errorMessage = messageKeyFromError(error, "pages.saveFailed"); throw error; }
    },

    async moveGroup(groupId: string, pageId: string) {
      this.errorMessage = "";
      try { await moveLinkGroupToPage(groupId, pageId); await this.loadLinks(); }
      catch (error) { this.errorMessage = messageKeyFromError(error, "pages.saveFailed"); throw error; }
    },

    async ensureCurrentGroup() {
      if (this.defaultGroupId) return this.defaultGroupId;
      try {
        const group = await ensureDefaultLinkGroup(this.activePageId);
        await this.loadLinks();
        return group.id;
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.createGroup");
        throw error;
      }
    },

    async addGroup(name: string) {
      this.errorMessage = "";

      try {
        const group = await createLinkGroup({ name, page_id: this.activePageId });
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

    async updateGroup(groupId: string, name: string, colorIndex: number) {
      this.errorMessage = "";

      try {
        await updateLinkGroup({ id: groupId, name, colorIndex });
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
      this.groups = applyGroupOrder(this.groups, groupIds);

      try {
        await reorderLinkGroups({ group_ids: groupIds });
        await this.loadLinks();
      } catch (error) {
        await this.loadLinks();
        this.errorMessage = messageKeyFromError(error, "error.sortGroups");
        throw error;
      }
    },

    async sortLinks(groups: ReorderLinksInput["groups"]) {
      this.errorMessage = "";
      this.groups = applyLinkOrder(this.groups, groups);

      try {
        await reorderLinks({ groups });
        await this.loadLinks();
      } catch (error) {
        await this.loadLinks();
        this.errorMessage = messageKeyFromError(error, "error.sortLinks");
        throw error;
      }
    },

    async recordLinkOpen(link: Link) {
      await incrementLinkOpenStats(link.id);
      await this.loadLinks();
    },

    async openLink(link: Link, options?: { active?: boolean }) {
      await this.recordLinkOpen(link);
      const active = options?.active !== false;

      if (typeof chrome !== "undefined" && chrome.tabs?.create) {
        await chrome.tabs.create({ url: link.url, active });
        return;
      }

      window.open(link.url, "_blank", "noopener");
    }
  }
});
