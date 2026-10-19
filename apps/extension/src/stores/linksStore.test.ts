import { describe, expect, it } from "vitest";
import { applyGroupOrder, applyLinkOrder, browserTabToLinkInput } from "@/stores/linksStore";
import type { BrowserTab } from "@/types/browserTabs";
import type { Link, LinkGroupWithLinks } from "@/types/links";

const link = (id: string, groupId: string) => ({ id, group_id: groupId }) as Link;
const group = (id: string, linkIds: string[]) =>
  ({ id, links: linkIds.map((linkId) => link(linkId, id)) }) as LinkGroupWithLinks;

describe("browserTabToLinkInput", () => {
  it("translates a Browser Tab into a browser-tab sourced Link", () => {
    const tab: BrowserTab = {
      id: 42,
      windowId: 7,
      title: "Tabvia",
      url: "https://example.com/docs",
      favIconUrl: "https://example.com/favicon.ico",
      active: false,
      pinned: true
    };

    expect(browserTabToLinkInput(tab, "research")).toEqual({
      group_id: "research",
      title: "Tabvia",
      url: "https://example.com/docs",
      favicon_url: "https://example.com/favicon.ico",
      source: "browser_tab"
    });
  });
});

describe("applyLinkOrder", () => {
  it("reorders Links within a group and keeps the original Link objects", () => {
    const current = [group("a", ["1", "2", "3"]), group("b", ["4"])];
    const next = applyLinkOrder(current, [{ group_id: "a", link_ids: ["3", "1", "2"] }]);

    expect(next[0].links.map((item) => item.id)).toEqual(["3", "1", "2"]);
    expect(next[0].links[0]).toBe(current[0].links[2]);
    expect(next[1]).toBe(current[1]);
  });

  it("moves a Link across groups and updates its group_id", () => {
    const current = [group("a", ["1", "2"]), group("b", ["3"])];
    const next = applyLinkOrder(current, [
      { group_id: "a", link_ids: ["2"] },
      { group_id: "b", link_ids: ["1", "3"] }
    ]);

    expect(next.map((item) => item.links.map((entry) => entry.id))).toEqual([["2"], ["1", "3"]]);
    expect(next[1].links[0].group_id).toBe("b");
  });
});

describe("applyGroupOrder", () => {
  it("sorts groups by the given ids", () => {
    const current = [group("a", []), group("b", []), group("c", [])];
    expect(applyGroupOrder(current, ["c", "a", "b"]).map((item) => item.id)).toEqual(["c", "a", "b"]);
  });
});
