import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const DATABASE_NAME = "happy_tab";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

describe("navShortcutsRepository", () => {
  let tabviaDb: (typeof import("@/db/tabviaDb"))["tabviaDb"];
  let repository: typeof import("@/repositories/navShortcutsRepository");

  beforeEach(async () => {
    const dbModule = await import("@/db/tabviaDb");
    tabviaDb = dbModule.tabviaDb;
    tabviaDb.close();
    await Dexie.delete(DATABASE_NAME);
    await tabviaDb.open();
    repository = await import("@/repositories/navShortcutsRepository");
  });

  afterEach(async () => {
    tabviaDb.close();
    await Dexie.delete(DATABASE_NAME);
  });

  it("stores a shortcut with a site name and rejects a duplicate URL", async () => {
    const created = await repository.createNavShortcut({ url: "github.com/miss55" });

    expect(created.title).toBe("github.com");
    expect(created.url).toBe("https://github.com/miss55");
    expect(created.sort_order).toBe(0);

    await expect(repository.createNavShortcut({ url: "https://github.com/miss55" })).rejects.toThrow(
      "error.navDuplicate"
    );
    await expect(repository.listNavShortcuts()).resolves.toHaveLength(1);
  });

  it("reorders, updates, and hides soft-deleted shortcuts", async () => {
    const first = await repository.createNavShortcut({ title: "GitHub", url: "https://github.com" });
    const second = await repository.createNavShortcut({ title: "Docs", url: "https://example.com/docs" });

    await repository.reorderNavShortcuts([second.id, first.id]);
    await repository.updateNavShortcut({
      id: first.id,
      title: "Code",
      url: "https://github.com/miss55",
      favicon_url: "https://github.com/favicon.ico"
    });
    await repository.softDeleteNavShortcut(second.id);

    const listed = await repository.listNavShortcuts();
    expect(listed.map((shortcut) => shortcut.id)).toEqual([first.id]);
    expect(listed[0]).toMatchObject({
      title: "Code",
      url: "https://github.com/miss55",
      favicon_url: "https://github.com/favicon.ico",
      sort_order: 1
    });
  });

  it("undoes multiple removals with the same IDs, icons, and original order", async () => {
    const first = await repository.createNavShortcut({ title: "First", url: "https://first.example" });
    const second = await repository.createNavShortcut({ title: "Second", url: "https://second.example", favicon_url: "https://second.example/icon.png" });
    const third = await repository.createNavShortcut({ title: "Third", url: "https://third.example" });
    await repository.softDeleteNavShortcut(first.id);
    await repository.softDeleteNavShortcut(second.id);
    await repository.restoreNavShortcut(second.id);
    await repository.restoreNavShortcut(first.id);
    const listed = await repository.listNavShortcuts();
    expect(listed.map((shortcut) => shortcut.id)).toEqual([first.id, second.id, third.id]);
    expect(listed[1].favicon_url).toBe(second.favicon_url);
    expect(listed.every((shortcut) => shortcut.deleted_at === undefined)).toBe(true);
    await repository.restoreNavShortcut(first.id);
    expect(await repository.listNavShortcuts()).toHaveLength(3);
  });

  it("keeps a deleted shortcut recoverable if its URL was added again", async () => {
    const original = await repository.createNavShortcut({ url: "https://example.com" });
    await repository.softDeleteNavShortcut(original.id);
    const replacement = await repository.createNavShortcut({ url: original.url });
    await expect(repository.restoreNavShortcut(original.id)).rejects.toThrow("error.navDuplicate");
    expect((await tabviaDb.nav_shortcuts.get(original.id))?.deleted_at).toBeTruthy();
    expect((await repository.listNavShortcuts()).map((shortcut) => shortcut.id)).toEqual([replacement.id]);
    await repository.softDeleteNavShortcut(replacement.id);
    await repository.restoreNavShortcut(original.id);
    expect((await repository.listNavShortcuts()).map((shortcut) => shortcut.id)).toEqual([original.id]);
  });
});
