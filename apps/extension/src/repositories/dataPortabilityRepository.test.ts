import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TabviaBackupV1 } from "@/types/dataPortability";

const DATABASE_NAME = "happy_tab";
const timestamp = "2026-07-30T00:00:00.000Z";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

const makeBackup = (): TabviaBackupV1 => ({
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
  let tabviaDb: (typeof import("@/db/tabviaDb"))["tabviaDb"];
  let repository: typeof import("@/repositories/dataPortabilityRepository");

  beforeEach(async () => {
    const dbModule = await import("@/db/tabviaDb");
    tabviaDb = dbModule.tabviaDb;
    tabviaDb.close();
    await Dexie.delete(DATABASE_NAME);
    await tabviaDb.open();
    repository = await import("@/repositories/dataPortabilityRepository");
  });

  afterEach(async () => {
    tabviaDb.close();
    await Dexie.delete(DATABASE_NAME);
  });

  it("exports only active, internally consistent local business data", async () => {
    const backup = makeBackup();
    await tabviaDb.link_groups.bulkPut([
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
    await tabviaDb.links.bulkPut(backup.data.links);
    await tabviaDb.todos.bulkPut(backup.data.todos);
    await tabviaDb.usage_stats.bulkPut(backup.data.usage_stats);
    await tabviaDb.sync_queue.add({
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

    const exported = await repository.createTabviaBackup();

    expect(exported.data.link_groups.map((group) => group.id)).toEqual(["group-imported"]);
    expect(exported.data.links).toHaveLength(1);
    expect(exported.data.todos).toHaveLength(1);
    expect(exported.data.usage_stats).toHaveLength(1);
    expect(exported).not.toHaveProperty("data.sync_queue");
  });

  it("rejects malformed, unsafe, and internally inconsistent backups before writing", async () => {
    expect(() => repository.parseTabviaBackupJson("{")).toThrowError(
      expect.objectContaining({ code: "invalid_json" })
    );

    const unsafeBackup = makeBackup();
    unsafeBackup.data.links[0].url = "javascript:alert(1)";
    expect(() => repository.parseTabviaBackup(unsafeBackup)).toThrowError(
      expect.objectContaining({ code: "unsafe_url" })
    );

    const unsupportedBackup = { ...makeBackup(), version: 2 };
    expect(() => repository.parseTabviaBackup(unsupportedBackup)).toThrowError(
      expect.objectContaining({ code: "unsupported_version" })
    );

    const orphanedBackup = makeBackup();
    orphanedBackup.data.links[0].group_id = "missing-group";
    expect(() => repository.parseTabviaBackup(orphanedBackup)).toThrowError(
      expect.objectContaining({ code: "invalid_data" })
    );

    const invalidDateBackup = makeBackup();
    invalidDateBackup.data.todos[0].updated_at = "not-a-date";
    expect(() => repository.parseTabviaBackup(invalidDateBackup)).toThrowError(
      expect.objectContaining({ code: "invalid_data" })
    );

    await expect(tabviaDb.link_groups.count()).resolves.toBe(0);
  });

  it("rejects backup files larger than the configured limit before reading them", async () => {
    const { MAX_BACKUP_FILE_SIZE_BYTES, readTabviaBackupFile } = await import(
      "@/services/dataPortability"
    );
    const oversizedFile = {
      size: MAX_BACKUP_FILE_SIZE_BYTES + 1,
      text: async () => JSON.stringify(makeBackup())
    } as File;

    await expect(readTabviaBackupFile(oversizedFile)).rejects.toEqual(
      expect.objectContaining({ code: "file_too_large" })
    );
  });

  it("merges imported records without deleting unrelated local data", async () => {
    await tabviaDb.link_groups.add({
      id: "group-local",
      name: "Local",
      sort_order: 0,
      created_at: timestamp,
      updated_at: timestamp
    });
    await tabviaDb.sync_queue.bulkAdd([
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

    const summary = await repository.importTabviaBackup(makeBackup(), "merge");

    await expect(tabviaDb.link_groups.toArray()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "group-local" }),
        expect.objectContaining({ id: "group-imported" })
      ])
    );
    await expect(tabviaDb.sync_queue.toArray()).resolves.toEqual([
      expect.objectContaining({ id: "queue-unrelated-record" })
    ]);
    expect(summary).toEqual({ link_groups: 1, links: 1, todos: 1, usage_stats: 1 });
  });

  it("replaces business data atomically and clears stale sync queue items", async () => {
    await tabviaDb.link_groups.add({
      id: "group-local",
      name: "Local",
      sort_order: 0,
      created_at: timestamp,
      updated_at: timestamp
    });
    await tabviaDb.sync_queue.add({
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
    await tabviaDb.theme_assets.add({
      id: "background",
      blob: new Blob(["background"], { type: "image/png" }),
      file_name: "background.png",
      mime_type: "image/png",
      size: 10,
      updated_at: timestamp
    });

    await repository.importTabviaBackup(makeBackup(), "replace");

    await expect(tabviaDb.link_groups.toArray()).resolves.toEqual([
      expect.objectContaining({ id: "group-imported" })
    ]);
    await expect(tabviaDb.sync_queue.count()).resolves.toBe(0);
    await expect(tabviaDb.theme_assets.get("background")).resolves.toMatchObject({
      file_name: "background.png"
    });
  });
});
