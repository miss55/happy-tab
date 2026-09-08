import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LinkGroup } from "@/types/links";

const DATABASE_NAME = "happy_tab";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

const createLegacyDatabase = async (version: 1 | 2, group: LinkGroup) => {
  const legacyDb = new Dexie(DATABASE_NAME);
  const schema = {
    linkGroups: "&id, sort_order, deleted_at, updated_at",
    links: "&id, group_id, sort_order, deleted_at, updated_at"
  };

  legacyDb.version(version).stores(
    version === 1
      ? schema
      : {
          ...schema,
          todos: "&id, completed, sort_order, deleted_at, updated_at"
        }
  );

  await legacyDb.open();
  await legacyDb.table<LinkGroup, string>("linkGroups").add(group);
  legacyDb.close();
};

const createVersion3Database = async (group: LinkGroup) => {
  const version3Db = new Dexie(DATABASE_NAME);
  version3Db.version(3).stores({
    link_groups: "&id, sort_order, deleted_at, updated_at",
    links: "&id, group_id, sort_order, deleted_at, updated_at",
    todos: "&id, completed, sort_order, deleted_at, updated_at",
    usage_stats: "&id, target_type, target_id, deleted_at, updated_at",
    sync_queue: "&id, entity_type, entity_id, status, created_at, deleted_at"
  });

  await version3Db.open();
  await version3Db.table<LinkGroup, string>("link_groups").add(group);
  version3Db.close();
};

describe("HappyTabDb migrations", () => {
  beforeEach(async () => {
    await Dexie.delete(DATABASE_NAME);
  });

  afterEach(async () => {
    const { happyTabDb } = await import("@/db/happyTabDb");
    happyTabDb.close();
    await Dexie.delete(DATABASE_NAME);
  });

  it.each([1, 2] as const)("preserves link groups when upgrading a version %s database", async (version) => {
    const legacyGroup: LinkGroup = {
      id: `legacy-group-v${version}`,
      name: "Legacy",
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z"
    };
    await createLegacyDatabase(version, legacyGroup);

    const { happyTabDb } = await import("@/db/happyTabDb");
    await happyTabDb.open();

    await expect(happyTabDb.link_groups.toArray()).resolves.toEqual([legacyGroup]);
  });

  it("preserves data for databases already created at version 3", async () => {
    const currentGroup: LinkGroup = {
      id: "current-group",
      name: "Current",
      sort_order: 0,
      created_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z"
    };
    await createVersion3Database(currentGroup);

    const { happyTabDb } = await import("@/db/happyTabDb");
    await happyTabDb.open();

    await expect(happyTabDb.link_groups.toArray()).resolves.toEqual([currentGroup]);
  });

  it("creates only the current table names for a fresh database", async () => {
    const { happyTabDb } = await import("@/db/happyTabDb");
    await happyTabDb.open();

    const tableNames = happyTabDb.tables.map((table) => table.name);
    expect(tableNames).toContain("link_groups");
    expect(tableNames).toContain("theme_assets");
    expect(tableNames).not.toContain("linkGroups");
  });

  it("stores a local background image asset", async () => {
    const { happyTabDb } = await import("@/db/happyTabDb");
    const { getThemeBackgroundAsset, saveThemeBackgroundAsset } = await import(
      "@/repositories/themeAssetRepository"
    );
    await happyTabDb.open();

    await saveThemeBackgroundAsset({
      blob: new Blob(["background"], { type: "image/png" }),
      fileName: "background.png",
      mimeType: "image/png",
      size: 10
    });

    const asset = await getThemeBackgroundAsset();
    expect(asset).toMatchObject({
      id: "background",
      file_name: "background.png",
      mime_type: "image/png",
      size: 10
    });
    await expect(asset?.blob.text()).resolves.toBe("background");
  });
});
