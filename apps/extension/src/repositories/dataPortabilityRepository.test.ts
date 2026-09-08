import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { HappyTabBackupV1 } from "@/types/dataPortability";

const DATABASE_NAME = "happy_tab";
const timestamp = "2026-07-30T00:00:00.000Z";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

const makeBackup = (): HappyTabBackupV1 => ({
  format: "happy-tab-backup",
  version: 1,
  exported_at: timestamp,
  data: {
    link_groups: [
      {
        id: "group-imported",
        name: "Imported",
        sort_order: 0,
        created_at: timestamp,
        updated_at: timestamp
      }
    ],
    links: [
      {
        id: "link-imported",
        group_id: "group-imported",
        title: "Imported Link",
        url: "https://example.com/imported",
        sort_order: 0,
        open_count: 3,
        source: "manual",
        created_at: timestamp,
        updated_at: timestamp
      }
    ],
    todos: [
      {
        id: "todo-imported",
        title: "Imported Todo",
        completed: false,
        sort_order: 0,
        created_at: timestamp,
        updated_at: timestamp
      }
    ],
    usage_stats: [
      {
        id: "stat-imported",
        target_type: "link",
        target_id: "link-imported",
        open_count: 3,
        created_at: timestamp,
        updated_at: timestamp
      }
    ]
  }
});

describe("dataPortabilityRepository", () => {
  let happyTabDb: (typeof import("@/db/happyTabDb"))["happyTabDb"];
  let repository: typeof import("@/repositories/dataPortabilityRepository");

  beforeEach(async () => {
    const dbModule = await import("@/db/happyTabDb");
    happyTabDb = dbModule.happyTabDb;
    happyTabDb.close();
    await Dexie.delete(DATABASE_NAME);
    await happyTabDb.open();
    repository = await import("@/repositories/dataPortabilityRepository");
  });

  afterEach(async () => {
    happyTabDb.close();
    await Dexie.delete(DATABASE_NAME);
  });

  it("exports only active, internally consistent local business data", async () => {
    const backup = makeBackup();
    await happyTabDb.link_groups.bulkPut([
      ...backup.data.link_groups,
      {
        id: "group-deleted",
        name: "Deleted",
        sort_order: 1,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: timestamp
      }
    ]);
    await happyTabDb.links.bulkPut(backup.data.links);
    await happyTabDb.todos.bulkPut(backup.data.todos);
    await happyTabDb.usage_stats.bulkPut(backup.data.usage_stats);
    await happyTabDb.sync_queue.add({
      id: "queue-private",
      entity_type: "link",
      entity_id: "link-imported",
      operation: "update",
      payload: { private: true },
      status: "pending",
      retry_count: 0,
      created_at: timestamp,
      updated_at: timestamp
    });

    const exported = await repository.createHappyTabBackup();

    expect(exported.data.link_groups.map((group) => group.id)).toEqual(["group-imported"]);
    expect(exported.data.links).toHaveLength(1);
    expect(exported.data.todos).toHaveLength(1);
    expect(exported.data.usage_stats).toHaveLength(1);
    expect(exported).not.toHaveProperty("data.sync_queue");
  });

  it("rejects malformed, unsafe, and internally inconsistent backups before writing", async () => {
    expect(() => repository.parseHappyTabBackupJson("{")).toThrowError(
      expect.objectContaining({ code: "invalid_json" })
    );

    const unsafeBackup = makeBackup();
    unsafeBackup.data.links[0].url = "javascript:alert(1)";
    expect(() => repository.parseHappyTabBackup(unsafeBackup)).toThrowError(
      expect.objectContaining({ code: "unsafe_url" })
    );

    const unsupportedBackup = { ...makeBackup(), version: 2 };
    expect(() => repository.parseHappyTabBackup(unsupportedBackup)).toThrowError(
      expect.objectContaining({ code: "unsupported_version" })
    );

    const orphanedBackup = makeBackup();
    orphanedBackup.data.links[0].group_id = "missing-group";
    expect(() => repository.parseHappyTabBackup(orphanedBackup)).toThrowError(
      expect.objectContaining({ code: "invalid_data" })
    );

    const invalidDateBackup = makeBackup();
    invalidDateBackup.data.todos[0].updated_at = "not-a-date";
    expect(() => repository.parseHappyTabBackup(invalidDateBackup)).toThrowError(
      expect.objectContaining({ code: "invalid_data" })
    );

    await expect(happyTabDb.link_groups.count()).resolves.toBe(0);
  });

  it("rejects backup files larger than the configured limit before reading them", async () => {
    const { MAX_BACKUP_FILE_SIZE_BYTES, readHappyTabBackupFile } = await import(
      "@/services/dataPortability"
    );
    const oversizedFile = {
      size: MAX_BACKUP_FILE_SIZE_BYTES + 1,
      text: async () => JSON.stringify(makeBackup())
    } as File;

    await expect(readHappyTabBackupFile(oversizedFile)).rejects.toEqual(
      expect.objectContaining({ code: "file_too_large" })
    );
  });

  it("merges imported records without deleting unrelated local data", async () => {
    await happyTabDb.link_groups.add({
      id: "group-local",
      name: "Local",
      sort_order: 0,
      created_at: timestamp,
      updated_at: timestamp
    });
    await happyTabDb.sync_queue.bulkAdd([
      {
        id: "queue-imported-record",
        entity_type: "link",
        entity_id: "link-imported",
        operation: "update",
        payload: { stale: true },
        status: "pending",
        retry_count: 0,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: "queue-unrelated-record",
        entity_type: "link_group",
        entity_id: "group-local",
        operation: "update",
        payload: { keep: true },
        status: "pending",
        retry_count: 0,
        created_at: timestamp,
        updated_at: timestamp
      }
    ]);

    const summary = await repository.importHappyTabBackup(makeBackup(), "merge");

    await expect(happyTabDb.link_groups.toArray()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "group-local" }),
        expect.objectContaining({ id: "group-imported" })
      ])
    );
    await expect(happyTabDb.sync_queue.toArray()).resolves.toEqual([
      expect.objectContaining({ id: "queue-unrelated-record" })
    ]);
    expect(summary).toEqual({ link_groups: 1, links: 1, todos: 1, usage_stats: 1 });
  });

  it("replaces business data atomically and clears stale sync queue items", async () => {
    await happyTabDb.link_groups.add({
      id: "group-local",
      name: "Local",
      sort_order: 0,
      created_at: timestamp,
      updated_at: timestamp
    });
    await happyTabDb.sync_queue.add({
      id: "queue-local",
      entity_type: "link_group",
      entity_id: "group-local",
      operation: "delete",
      payload: {},
      status: "pending",
      retry_count: 0,
      created_at: timestamp,
      updated_at: timestamp
    });
    await happyTabDb.theme_assets.add({
      id: "background",
      blob: new Blob(["background"], { type: "image/png" }),
      file_name: "background.png",
      mime_type: "image/png",
      size: 10,
      updated_at: timestamp
    });

    await repository.importHappyTabBackup(makeBackup(), "replace");

    await expect(happyTabDb.link_groups.toArray()).resolves.toEqual([
      expect.objectContaining({ id: "group-imported" })
    ]);
    await expect(happyTabDb.sync_queue.count()).resolves.toBe(0);
    await expect(happyTabDb.theme_assets.get("background")).resolves.toMatchObject({
      file_name: "background.png"
    });
  });
});
