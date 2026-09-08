import { describe, expect, it } from "vitest";
import { browserTabToLinkInput } from "@/stores/linksStore";
import type { BrowserTab } from "@/types/browserTabs";

describe("browserTabToLinkInput", () => {
  it("translates a Browser Tab into a browser-tab sourced Link", () => {
    const tab: BrowserTab = {
      id: 42,
      windowId: 7,
      title: "HappyTab",
      url: "https://example.com/docs",
      favIconUrl: "https://example.com/favicon.ico",
      active: false,
      pinned: true
    };

    expect(browserTabToLinkInput(tab, "research")).toEqual({
      group_id: "research",
      title: "HappyTab",
      url: "https://example.com/docs",
      favicon_url: "https://example.com/favicon.ico",
      source: "browser_tab"
    });
  });
});
