import { describe, expect, it } from "vitest";
import { mergeSnapshots, type MergedSnapshotData } from "./mergeEngine";
import type { SyncSnapshot } from "./types";
import { DEFAULT_BOOKMARK_PAGE_ID, createDefaultBookmarkPage } from "@/types/bookmarkPages";

describe("mergeEngine", () => {
  it("merges link_groups and links based on latest updated_at", () => {
    const local: MergedSnapshotData = {
      link_groups: [
        { id: "g1", name: "Local G1", sort_order: 1, created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-01T10:00:00.000Z" }
      ],
      links: [],
      todos: []
    };

    const remote: SyncSnapshot = {
      version: 1,
      updated_at: "2025-01-01T12:00:00.000Z",
      data: {
        link_groups: [
          { id: "g1", name: "Remote G1", sort_order: 1, created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-01T12:00:00.000Z" },
          { id: "g2", name: "Remote G2", sort_order: 2, created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-01T12:00:00.000Z" }
        ],
        links: [],
        todos: [],
        usage_stats: []
      }
    };

    const merged = mergeSnapshots(local, remote);
    expect(merged.link_groups).toHaveLength(2);
    expect(merged.link_groups.find((g) => g.id === "g1")?.name).toBe("Remote G1");
  });

  it("keeps local data when the remote snapshot has no data payload", () => {
    const local: MergedSnapshotData = {
      link_groups: [
        { id: "g1", name: "Local G1", sort_order: 1, created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-01T10:00:00.000Z" }
      ],
      links: [],
      todos: []
    };

    const merged = mergeSnapshots(local, { version: 1, updated_at: "2025-01-01T12:00:00.000Z" } as SyncSnapshot);
    expect(merged.link_groups).toEqual(local.link_groups.map(group => ({ ...group, page_id: DEFAULT_BOOKMARK_PAGE_ID })));
  });

  it("keeps page names, tombstones and known group ownership when a legacy client pushes newer groups", () => {
    const page = { ...createDefaultBookmarkPage(), id: "work", name: "Work" };
    const group = { id: "g", name: "Group", page_id: page.id, sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" };
    const deleted = { ...page, id: "deleted", deleted_at: "2026-02-01T00:00:00.000Z" };
    const { page_id: _page, ...legacyGroup } = group;
    const merged = mergeSnapshots({ bookmark_pages: [page, deleted], link_groups: [group], links: [], todos: [] }, {
      version: 1, updated_at: "2026-02-01T00:00:00.000Z", data: {
        link_groups: [{ ...legacyGroup, name: "Legacy edit", updated_at: "2026-02-01T00:00:00.000Z" }], links: [], todos: []
      }
    });
    expect(merged.bookmark_pages).toEqual(expect.arrayContaining([page, deleted]));
    expect(merged.link_groups[0]).toMatchObject({ name: "Legacy edit", page_id: "work" });
  });

  it("merges page changes by timestamp and keeps racing groups visible after empty-page deletion", () => {
    const page = { ...createDefaultBookmarkPage(), id: "work", name: "Work" };
    const timestamp = "2026-02-01T00:00:00.000Z";
    const group = { id: "g", name: "Group", page_id: page.id, sort_order: 0, created_at: timestamp, updated_at: timestamp };
    const deleted = { ...page, updated_at: timestamp, deleted_at: timestamp };
    const merged = mergeSnapshots({ bookmark_pages: [page], link_groups: [group], links: [], todos: [] }, {
      version: 2, updated_at: timestamp, data: { bookmark_pages: [deleted], link_groups: [], links: [], todos: [] }
    });
    expect(merged.bookmark_pages).toContainEqual(deleted);
    expect(merged.link_groups[0].page_id).toBe(DEFAULT_BOOKMARK_PAGE_ID);
  });

  it("accepts legacy-only groups into a single deterministic default page", () => {
    const merged = mergeSnapshots({ link_groups: [], links: [], todos: [] }, {
      version: 1, updated_at: "2026-01-01T00:00:00.000Z", data: {
        link_groups: [{ id: "legacy", name: "Legacy", sort_order: 3, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" }], links: [], todos: []
      }
    });
    expect(merged.bookmark_pages).toEqual([createDefaultBookmarkPage()]);
    expect(merged.link_groups[0]).toMatchObject({ page_id: DEFAULT_BOOKMARK_PAGE_ID, sort_order: 3 });
  });
});
