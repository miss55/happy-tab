import { afterEach, describe, expect, it, vi } from "vitest";
import { getBrowserWindowGroups, subscribeBrowserTabUpdates } from "@/services/browserTabs";

const stubChromeWindows = (windows: Array<Partial<chrome.windows.Window>>) => {
  vi.stubGlobal("chrome", {
    windows: {
      getAll: vi.fn().mockResolvedValue(windows)
    },
    tabs: {
      update: vi.fn(),
      remove: vi.fn()
    }
  });
};

const stubChrome = (tabs: Array<Partial<chrome.tabs.Tab>>) => {
  stubChromeWindows([
    {
      id: 7,
      focused: true,
      type: "normal",
      tabs: tabs as chrome.tabs.Tab[]
    }
  ]);
};

describe("browser tab updates", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("delivers late favicons and URL changes, ignores unrelated updates, and unsubscribes", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    vi.stubGlobal("chrome", { tabs: { onUpdated: { addListener, removeListener } } });
    const onUpdate = vi.fn();
    const unsubscribe = subscribeBrowserTabUpdates(onUpdate);
    const listener = addListener.mock.calls[0][0];
    const tab = { id: 3, windowId: 7, title: "Example", url: "https://example.com" };
    listener(3, { audible: true }, tab);
    expect(onUpdate).not.toHaveBeenCalled();
    listener(3, { favIconUrl: "https://example.com/icon.png" }, { ...tab, favIconUrl: "https://example.com/icon.png" });
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ id: 3, favIconUrl: "https://example.com/icon.png" }));
    listener(3, { url: "https://other.test" }, { ...tab, url: "https://other.test" });
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ url: "https://other.test", favIconUrl: undefined }));
    unsubscribe();
    expect(removeListener).toHaveBeenCalledWith(listener);
  });

  it("is safe outside Chrome", () => {
    vi.stubGlobal("chrome", undefined);
    expect(() => subscribeBrowserTabUpdates(vi.fn())()).not.toThrow();
  });
});

describe("getBrowserWindowGroups", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("orders tabs by most recent access within their browser window", async () => {
    stubChrome([
      { id: 1, windowId: 7, title: "Oldest", lastAccessed: 100 },
      { id: 2, windowId: 7, title: "Newest", lastAccessed: 300 },
      { id: 3, windowId: 7, title: "Middle", lastAccessed: 200 }
    ]);

    const groups = await getBrowserWindowGroups();

    expect(groups[0]?.tabs.map((tab) => tab.title)).toEqual(["Newest", "Middle", "Oldest"]);
  });

  it("keeps Chrome's original order when access timestamps are unavailable", async () => {
    stubChrome([
      { id: 1, windowId: 7, title: "First" },
      { id: 2, windowId: 7, title: "Second" },
      { id: 3, windowId: 7, title: "Third" }
    ]);

    const groups = await getBrowserWindowGroups();

    expect(groups[0]?.tabs.map((tab) => tab.title)).toEqual(["First", "Second", "Third"]);
  });

  it("places the currently focused browser window before other windows", async () => {
    stubChromeWindows([
      { id: 1, focused: false, type: "normal", tabs: [] },
      { id: 2, focused: true, type: "normal", tabs: [] },
      { id: 3, focused: false, type: "normal", tabs: [] }
    ]);

    const groups = await getBrowserWindowGroups();

    expect(groups.map((group) => group.id)).toEqual([2, 1, 3]);
  });

  it("filters only the active tab from the currently focused window", async () => {
    stubChromeWindows([
      {
        id: 1,
        focused: false,
        type: "normal",
        tabs: [
          { id: 11, windowId: 1, title: "Other window active tab", active: true },
          { id: 12, windowId: 1, title: "Other window inactive tab", active: false }
        ] as chrome.tabs.Tab[]
      },
      {
        id: 2,
        focused: true,
        type: "normal",
        tabs: [
          { id: 21, windowId: 2, title: "Tabvia", active: true },
          { id: 22, windowId: 2, title: "Visible tab", active: false }
        ] as chrome.tabs.Tab[]
      }
    ]);

    const groups = await getBrowserWindowGroups();

    expect(groups[0]?.tabs.map((tab) => tab.title)).toEqual(["Visible tab"]);
    expect(groups[1]?.tabs.map((tab) => tab.title)).toEqual([
      "Other window active tab",
      "Other window inactive tab"
    ]);
  });
});
