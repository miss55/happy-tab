import { describe, expect, it } from "vitest";
import { mergeSnapshots, type MergedSnapshotData } from "./mergeEngine";
import type { SyncSnapshot } from "./types";

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
    expect(merged.link_groups).toEqual(local.link_groups);
  });
});
