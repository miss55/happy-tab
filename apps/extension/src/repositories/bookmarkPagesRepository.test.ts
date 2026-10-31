import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { DEFAULT_BOOKMARK_PAGE_ID } from "@/types/bookmarkPages";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;
const storage = vi.hoisted(() => ({ getLocalStorageValue: vi.fn(), setLocalStorageValue: vi.fn() }));
vi.mock("@/services/chromeStorage", () => storage);

describe("bookmark pages", () => {
  let db: (typeof import("@/db/tabviaDb"))["tabviaDb"];
  let pages: typeof import("@/repositories/bookmarkPagesRepository");
  let links: typeof import("@/repositories/linksRepository");
  beforeEach(async () => {
    db = (await import("@/db/tabviaDb")).tabviaDb;
    db.close();
    await Dexie.delete("happy_tab");
    await db.open();
    pages = await import("@/repositories/bookmarkPagesRepository");
    links = await import("@/repositories/linksRepository");
    await pages.ensureBookmarkPages();
    storage.getLocalStorageValue.mockReset().mockResolvedValue(undefined);
    storage.setLocalStorageValue.mockReset().mockResolvedValue(undefined);
    setActivePinia(createPinia());
  });
  afterEach(async () => { db.close(); await Dexie.delete("happy_tab"); });

  it("creates a single default page, including after late legacy data arrives", async () => {
    const timestamp = "2026-01-01T00:00:00.000Z";
    await db.link_groups.add({ id: "legacy", name: "Legacy", sort_order: 8, created_at: timestamp, updated_at: timestamp });
    await pages.ensureBookmarkPages();
    await pages.ensureBookmarkPages();
    expect(await pages.listBookmarkPages()).toHaveLength(1);
    expect(await db.link_groups.get("legacy")).toEqual({ id: "legacy", name: "Legacy", sort_order: 8,
      created_at: timestamp, updated_at: timestamp, page_id: DEFAULT_BOOKMARK_PAGE_ID });
  });

  it("moves a complete group without changing its links or statistics, and sorts only within its page", async () => {
    const work = await pages.createBookmarkPage("Work");
    const first = await links.createLinkGroup({ name: "First" });
    const second = await links.createLinkGroup({ name: "Second" });
    const target = await links.createLinkGroup({ name: "Target", page_id: work.id });
    const link = await links.createLink({ group_id: second.id, title: "Example", url: "https://example.com" });
    await links.incrementLinkOpenStats(link.id);
    const saved = await db.links.get(link.id);
    await pages.moveLinkGroupToPage(second.id, work.id);
    expect(await db.link_groups.get(second.id)).toMatchObject({ page_id: work.id, sort_order: 1 });
    expect(await db.links.get(link.id)).toEqual(saved);
    await links.reorderLinkGroups({ group_ids: [second.id, target.id] });
    expect(await db.link_groups.get(first.id)).toMatchObject({ page_id: DEFAULT_BOOKMARK_PAGE_ID, sort_order: 0 });
    await expect(links.reorderLinkGroups({ group_ids: [first.id, target.id] })).rejects.toThrow("pages.unavailable");
  });

  it("moves a single link to the end of a group on another page, retaining its identity and stats", async () => {
    const work = await pages.createBookmarkPage("Work");
    const source = await links.createLinkGroup({ name: "Source" });
    const target = await links.createLinkGroup({ name: "Target", page_id: work.id });
    const link = await links.createLink({ group_id: source.id, title: "Move", url: "https://example.com/move" });
    await links.incrementLinkOpenStats(link.id);
    await links.createLink({ group_id: target.id, title: "Existing", url: "https://example.com/existing" });
    await links.updateLink({ id: link.id, group_id: target.id, title: link.title, url: link.url });
    expect(await db.links.get(link.id)).toMatchObject({ id: link.id, group_id: target.id, sort_order: 1, open_count: 1, created_at: link.created_at });
  });

  it("rejects nonempty/default deletion and soft-deletes only empty pages", async () => {
    const work = await pages.createBookmarkPage("Work");
    const group = await links.createLinkGroup({ name: "Empty group", page_id: work.id });
    await expect(pages.deleteEmptyBookmarkPage(work.id)).rejects.toThrow("pages.notEmpty");
    await expect(pages.deleteEmptyBookmarkPage(DEFAULT_BOOKMARK_PAGE_ID)).rejects.toThrow("pages.keepDefault");
    await pages.moveLinkGroupToPage(group.id, DEFAULT_BOOKMARK_PAGE_ID);
    await pages.deleteEmptyBookmarkPage(work.id);
    expect(await db.bookmark_pages.get(work.id)).toHaveProperty("deleted_at");
    expect(await pages.listBookmarkPages()).toHaveLength(1);
    await expect(links.createLinkGroup({ name: "Invalid", page_id: work.id })).rejects.toThrow("pages.unavailable");
  });

  it("serializes page deletion against concurrent group creation", async () => {
    const work = await pages.createBookmarkPage("Work");
    await Promise.allSettled([
      pages.deleteEmptyBookmarkPage(work.id),
      links.createLinkGroup({ name: "Racing", page_id: work.id })
    ]);
    const page = await db.bookmark_pages.get(work.id);
    const groups = await db.link_groups.where("page_id").equals(work.id).toArray();
    expect(Boolean(page?.deleted_at) && groups.length > 0).toBe(false);
  });

  it("keeps empty pages empty, restores the last page locally, and creates a save target on that page", async () => {
    const work = await pages.createBookmarkPage("Work");
    await links.createLinkGroup({ name: "Default group" });
    storage.getLocalStorageValue.mockResolvedValue(work.id);
    const { useLinksStore } = await import("@/stores/linksStore");
    const store = useLinksStore();
    await store.loadLinks();
    expect(store.activePageId).toBe(work.id);
    expect(store.currentGroups).toEqual([]);
    expect(store.defaultGroupId).toBe("");
    const groupId = await store.ensureCurrentGroup();
    expect(await db.link_groups.get(groupId)).toMatchObject({ page_id: work.id });
    await store.selectPage(DEFAULT_BOOKMARK_PAGE_ID);
    expect(storage.setLocalStorageValue).toHaveBeenCalledWith("happy_tab_active_bookmark_page", DEFAULT_BOOKMARK_PAGE_ID);
    expect(store.currentGroups.every(group => group.page_id === DEFAULT_BOOKMARK_PAGE_ID)).toBe(true);
  });

  it("falls back when the remembered page was deleted and validates complete page reorders", async () => {
    const work = await pages.createBookmarkPage("Work");
    const other = await pages.createBookmarkPage("Other");
    await pages.reorderBookmarkPages([other.id, DEFAULT_BOOKMARK_PAGE_ID, work.id]);
    expect((await pages.listBookmarkPages()).map(page => page.id)).toEqual([other.id, DEFAULT_BOOKMARK_PAGE_ID, work.id]);
    await expect(pages.reorderBookmarkPages([work.id, work.id, other.id])).rejects.toThrow();
    await pages.deleteEmptyBookmarkPage(work.id);
    storage.getLocalStorageValue.mockResolvedValue(work.id);
    const { useLinksStore } = await import("@/stores/linksStore");
    const store = useLinksStore();
    await store.loadLinks();
    expect(store.activePageId).toBe(DEFAULT_BOOKMARK_PAGE_ID);
  });

  it("restores pages, membership and page tombstones onto a fresh syncing device", async () => {
    const work = await pages.createBookmarkPage("Work");
    const deleted = await pages.createBookmarkPage("Deleted");
    await pages.deleteEmptyBookmarkPage(deleted.id);
    const group = await links.createLinkGroup({ name: "Projects", page_id: work.id });
    const link = await links.createLink({ group_id: group.id, title: "Example", url: "https://example.com" });
    const { buildLocalSnapshot, applyMergedSnapshotToDb } = await import("@/services/sync/syncManager");
    const { mergeSnapshots } = await import("@/services/sync/mergeEngine");
    const snapshot = await buildLocalSnapshot();
    expect(snapshot.version).toBe(2);
    await db.bookmark_pages.clear();
    await db.link_groups.clear();
    await db.links.clear();
    const merged = mergeSnapshots({ bookmark_pages: [], link_groups: [], links: [], todos: [] }, snapshot);
    await applyMergedSnapshotToDb(merged);
    await pages.ensureBookmarkPages();
    expect(await db.bookmark_pages.get(work.id)).toEqual(work);
    expect(await db.bookmark_pages.get(deleted.id)).toHaveProperty("deleted_at");
    expect(await db.link_groups.get(group.id)).toEqual(group);
    expect(await db.links.get(link.id)).toEqual(link);
  });
});
