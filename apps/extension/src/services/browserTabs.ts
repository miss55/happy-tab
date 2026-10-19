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

const sameBrowserTab = (left: BrowserTab, right: BrowserTab): boolean =>
  left.id === right.id &&
  left.windowId === right.windowId &&
  left.title === right.title &&
  left.url === right.url &&
  left.favIconUrl === right.favIconUrl &&
  left.active === right.active &&
  left.pinned === right.pinned;

const sameWindowGroup = (left: BrowserWindowGroup, right: BrowserWindowGroup): boolean =>
  left.id === right.id &&
  left.focused === right.focused &&
  left.type === right.type &&
  left.tabs.length === right.tabs.length &&
  left.tabs.every((tab, index) => tab === right.tabs[index]);

export const reuseBrowserWindowGroups = (
  previous: BrowserWindowGroup[],
  next: BrowserWindowGroup[]
): BrowserWindowGroup[] => {
  if (
    previous.length === next.length &&
    previous.every((group, index) => {
      const incoming = next[index];
      return (
        incoming !== undefined &&
        group.id === incoming.id &&
        group.focused === incoming.focused &&
        group.type === incoming.type &&
        group.tabs.length === incoming.tabs.length &&
        group.tabs.every((tab, tabIndex) => sameBrowserTab(tab, incoming.tabs[tabIndex]!))
      );
    })
  ) {
    return previous;
  }

  const previousTabs = new Map<number, BrowserTab>();
  for (const group of previous) {
    for (const tab of group.tabs) {
      previousTabs.set(tab.id, tab);
    }
  }
  const previousGroups = new Map(previous.map((group) => [group.id, group]));

  return next.map((group) => {
    const tabs = group.tabs.map((tab) => {
      const existing = previousTabs.get(tab.id);
      return existing && sameBrowserTab(existing, tab) ? existing : tab;
    });
    const reused = { ...group, tabs };
    const existingGroup = previousGroups.get(group.id);
    return existingGroup && sameWindowGroup(existingGroup, reused) ? existingGroup : reused;
  });
};

export const closeBrowserTab = async (tabId: number): Promise<void> => {
  if (!isChromeTabsAvailable()) {
    return;
  }

  await chrome.tabs.remove(tabId);
};

export const subscribeBrowserTabUpdates = (onUpdate: (tab: BrowserTab) => void): (() => void) => {
  if (typeof chrome === "undefined" || !chrome.tabs?.onUpdated) return () => {};
  const listener = (_tabId: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (!["favIconUrl", "url", "title", "status"].some((key) => key in change)) return;
    const updated = toBrowserTab(tab);
    if (updated) onUpdate(updated);
  };
  chrome.tabs.onUpdated.addListener(listener);
  return () => chrome.tabs.onUpdated.removeListener(listener);
};
