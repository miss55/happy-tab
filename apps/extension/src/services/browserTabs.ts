import type { BrowserTab, BrowserWindowGroup, BrowserWindowType } from "@/types/browserTabs";

const isChromeTabsAvailable = () =>
  typeof chrome !== "undefined" &&
  Boolean(chrome.windows?.getAll) &&
  Boolean(chrome.tabs?.update) &&
  Boolean(chrome.tabs?.remove);

const toBrowserTab = (tab: chrome.tabs.Tab): BrowserTab | null => {
  if (typeof tab.id !== "number" || typeof tab.windowId !== "number") {
    return null;
  }

  return {
    id: tab.id,
    windowId: tab.windowId,
    title: tab.title?.trim() || tab.url || "—",
    url: tab.url || "",
    favIconUrl: tab.favIconUrl,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned)
  };
};

const sortTabsByLastAccessed = (tabs: chrome.tabs.Tab[]): chrome.tabs.Tab[] =>
  tabs
    .map((tab, index) => ({ tab, index }))
    .sort((left, right) => {
      const leftLastAccessed = left.tab.lastAccessed;
      const rightLastAccessed = right.tab.lastAccessed;

      if (typeof leftLastAccessed === "number" && typeof rightLastAccessed === "number") {
        return rightLastAccessed - leftLastAccessed || left.index - right.index;
      }

      if (typeof leftLastAccessed === "number") {
        return -1;
      }

      if (typeof rightLastAccessed === "number") {
        return 1;
      }

      return left.index - right.index;
    })
    .map(({ tab }) => tab);

export const getBrowserWindowGroups = async (): Promise<BrowserWindowGroup[]> => {
  if (!isChromeTabsAvailable()) {
    return [];
  }

  const windows = await chrome.windows.getAll({ populate: true });

  return windows
    .filter((window): window is chrome.windows.Window & { id: number } => typeof window.id === "number")
    .sort((left, right) => Number(right.focused) - Number(left.focused))
    .map((window) => ({
      id: window.id,
      focused: Boolean(window.focused),
      type: (window.type || "normal") as BrowserWindowType,
      tabs: sortTabsByLastAccessed(
        (window.tabs || []).filter((tab) => !(window.focused && tab.active))
      )
        .map(toBrowserTab)
        .filter((tab): tab is BrowserTab => tab !== null)
    }));
};

export const activateBrowserTab = async (tab: BrowserTab): Promise<void> => {
  if (!isChromeTabsAvailable()) {
    return;
  }

  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });
};

export const closeBrowserTab = async (tabId: number): Promise<void> => {
  if (!isChromeTabsAvailable()) {
    return;
  }

  await chrome.tabs.remove(tabId);
};
