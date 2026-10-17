import { tabviaDb } from "@/db/tabviaDb";
import type { LinkGroup, SavedLink } from "@/types/links";
import type { NavShortcut } from "@/types/navShortcuts";
import type { TodoItem } from "@/types/todos";
import type { UsageStat } from "@/types/usageStats";
import {
  DataBackupError,
  TABVIA_BACKUP_FORMAT,
  TABVIA_BACKUP_VERSION,
  type DataImportMode,
  type DataImportSummary,
  type TabviaBackupV1
} from "@/types/dataPortability";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const invalidData = (path: string): never => {
  throw new DataBackupError("invalid_data", path);
};

const readString = (record: UnknownRecord, key: string, path: string, allowEmpty = false) => {
  const value = record[key];

  if (typeof value !== "string" || (!allowEmpty && !value.trim())) {
    return invalidData(`${path}.${key}`);
  }

  return value;
};

const readOptionalString = (record: UnknownRecord, key: string, path: string) => {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  return typeof value === "string" ? value : invalidData(`${path}.${key}`);
};

const readDateString = (record: UnknownRecord, key: string, path: string) => {
  const value = readString(record, key, path);
  return Number.isNaN(Date.parse(value)) ? invalidData(`${path}.${key}`) : value;
};

const readOptionalDateString = (record: UnknownRecord, key: string, path: string) => {
  const value = readOptionalString(record, key, path);

  if (value === undefined) {
    return undefined;
  }

  return Number.isNaN(Date.parse(value)) ? invalidData(`${path}.${key}`) : value;
};

const readNonNegativeInteger = (record: UnknownRecord, key: string, path: string) => {
  const value = record[key];

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return invalidData(`${path}.${key}`);
  }

  return value;
};

const readBoolean = (record: UnknownRecord, key: string, path: string) => {
  const value = record[key];
  return typeof value === "boolean" ? value : invalidData(`${path}.${key}`);
};

const readRecordArray = <T>(
  record: UnknownRecord,
  key: string,
  parseItem: (item: UnknownRecord, path: string) => T
) => {
  const value = record[key];

  if (!Array.isArray(value)) {
    return invalidData(`data.${key}`);
  }

  return value.map((item, index) =>
    isRecord(item) ? parseItem(item, `data.${key}[${index}]`) : invalidData(`data.${key}[${index}]`)
  );
};

const isSafeWebUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const parseLinkGroup = (record: UnknownRecord, path: string): LinkGroup => ({
  id: readString(record, "id", path),
  name: readString(record, "name", path),
  description: readOptionalString(record, "description", path),
  icon: readOptionalString(record, "icon", path),
  color: readOptionalString(record, "color", path),
  sort_order: readNonNegativeInteger(record, "sort_order", path),
  created_at: readDateString(record, "created_at", path),
  updated_at: readDateString(record, "updated_at", path)
});

const parseSavedLink = (record: UnknownRecord, path: string): SavedLink => {
  const url = readString(record, "url", path);

  if (!isSafeWebUrl(url)) {
    throw new DataBackupError("unsafe_url", `${path}.url`);
  }

  const source = readOptionalString(record, "source", path);
  if (source !== undefined && !["manual", "browser_tab", "preset"].includes(source)) {
    return invalidData(`${path}.source`);
  }

  return {
    id: readString(record, "id", path),
    group_id: readString(record, "group_id", path),
    title: readString(record, "title", path),
    url,
    description: readOptionalString(record, "description", path),
    favicon_url: readOptionalString(record, "favicon_url", path),
    tags: readOptionalString(record, "tags", path),
    sort_order: readNonNegativeInteger(record, "sort_order", path),
    open_count: readNonNegativeInteger(record, "open_count", path),
    last_opened_at: readOptionalDateString(record, "last_opened_at", path),
    source: source as SavedLink["source"],
    created_at: readDateString(record, "created_at", path),
    updated_at: readDateString(record, "updated_at", path)
  };
};

const parseTodo = (record: UnknownRecord, path: string): TodoItem => ({
  id: readString(record, "id", path),
  title: readString(record, "title", path),
  completed: readBoolean(record, "completed", path),
  sort_order: readNonNegativeInteger(record, "sort_order", path),
  created_at: readDateString(record, "created_at", path),
  updated_at: readDateString(record, "updated_at", path),
  completed_at: readOptionalDateString(record, "completed_at", path)
});

const parseNavShortcut = (record: UnknownRecord, path: string): NavShortcut => {
  const url = readString(record, "url", path);

  if (!isSafeWebUrl(url)) {
    throw new DataBackupError("unsafe_url", `${path}.url`);
  }

  const faviconUrl = readOptionalString(record, "favicon_url", path);
  if (faviconUrl !== undefined && faviconUrl !== "" && !isSafeWebUrl(faviconUrl)) {
    throw new DataBackupError("unsafe_url", `${path}.favicon_url`);
  }

  return {
    id: readString(record, "id", path),
    title: readString(record, "title", path),
    url,
    favicon_url: faviconUrl || undefined,
    sort_order: readNonNegativeInteger(record, "sort_order", path),
    created_at: readDateString(record, "created_at", path),
    updated_at: readDateString(record, "updated_at", path)
  };
};

const parseUsageStat = (record: UnknownRecord, path: string): UsageStat => {
  const targetType = readString(record, "target_type", path);

  if (targetType !== "link") {
    return invalidData(`${path}.target_type`);
  }

  return {
    id: readString(record, "id", path),
    target_type: targetType,
    target_id: readString(record, "target_id", path),
    open_count: readNonNegativeInteger(record, "open_count", path),
    last_opened_at: readOptionalDateString(record, "last_opened_at", path),
    created_at: readDateString(record, "created_at", path),
    updated_at: readDateString(record, "updated_at", path)
  };
};

const ensureUniqueIds = (items: Array<{ id: string }>, path: string) => {
  const ids = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) {
      invalidData(`${path}.${item.id}`);
    }
    ids.add(item.id);
  }
};

export const parseTabviaBackup = (input: unknown): TabviaBackupV1 => {
  if (!isRecord(input) || input.format !== TABVIA_BACKUP_FORMAT) {
    throw new DataBackupError("invalid_format");
  }

  if (input.version !== TABVIA_BACKUP_VERSION) {
    throw new DataBackupError("unsupported_version");
  }

  const exportedAt = readDateString(input, "exported_at", "backup");

  if (!isRecord(input.data)) {
    return invalidData("data");
  }

  const linkGroups = readRecordArray(input.data, "link_groups", parseLinkGroup);
  const links = readRecordArray(input.data, "links", parseSavedLink);
  const todos = readRecordArray(input.data, "todos", parseTodo);
  const usageStats = readRecordArray(input.data, "usage_stats", parseUsageStat);
  const navShortcuts = Array.isArray(input.data.nav_shortcuts)
    ? readRecordArray(input.data, "nav_shortcuts", parseNavShortcut)
    : input.data.nav_shortcuts === undefined
      ? []
      : invalidData("data.nav_shortcuts");

  ensureUniqueIds(linkGroups, "data.link_groups");
  ensureUniqueIds(links, "data.links");
  ensureUniqueIds(todos, "data.todos");
  ensureUniqueIds(usageStats, "data.usage_stats");
  ensureUniqueIds(navShortcuts, "data.nav_shortcuts");

  const groupIds = new Set(linkGroups.map((group) => group.id));
  for (const link of links) {
    if (!groupIds.has(link.group_id)) {
      invalidData(`data.links.${link.id}.group_id`);
    }
  }

  const linkIds = new Set(links.map((link) => link.id));
  for (const stat of usageStats) {
    if (!linkIds.has(stat.target_id)) {
      invalidData(`data.usage_stats.${stat.id}.target_id`);
    }
  }

  return {
    format: TABVIA_BACKUP_FORMAT,
    version: TABVIA_BACKUP_VERSION,
    exported_at: exportedAt,
    data: {
      link_groups: linkGroups,
      links,
      todos,
      usage_stats: usageStats,
      nav_shortcuts: navShortcuts
    }
  };
};

export const parseTabviaBackupJson = (json: string): TabviaBackupV1 => {
  try {
    return parseTabviaBackup(JSON.parse(json) as unknown);
  } catch (error) {
    if (error instanceof DataBackupError) {
      throw error;
    }

    throw new DataBackupError("invalid_json");
  }
};

const activeOnly = <T extends { deleted_at?: string }>(items: T[]) =>
  items
    .filter((item) => item.deleted_at === undefined)
    .map(({ deleted_at: _deletedAt, ...item }) => item as T);

export const createTabviaBackup = async (): Promise<TabviaBackupV1> => {
  const linkGroups = activeOnly(await tabviaDb.link_groups.toArray()).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const groupIds = new Set(linkGroups.map((group) => group.id));
  const links = activeOnly(await tabviaDb.links.toArray())
    .filter((link) => groupIds.has(link.group_id))
    .sort((a, b) => a.group_id.localeCompare(b.group_id) || a.sort_order - b.sort_order);
  const linkIds = new Set(links.map((link) => link.id));
  const todos = activeOnly(await tabviaDb.todos.toArray()).sort((a, b) => a.sort_order - b.sort_order);
  const usageStats = activeOnly(await tabviaDb.usage_stats.toArray()).filter((stat) =>
    linkIds.has(stat.target_id)
  );
  const navShortcuts = activeOnly(await tabviaDb.nav_shortcuts.toArray()).sort(
    (left, right) => left.sort_order - right.sort_order
  );

  return {
    format: TABVIA_BACKUP_FORMAT,
    version: TABVIA_BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data: {
      link_groups: linkGroups,
      links,
      todos,
      usage_stats: usageStats,
      nav_shortcuts: navShortcuts
    }
  };
};

const normalizeImportedSortOrders = async () => {
  const groups = (await tabviaDb.link_groups.toArray())
    .filter((group) => group.deleted_at === undefined)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));

  await tabviaDb.link_groups.bulkPut(groups.map((group, index) => ({ ...group, sort_order: index })));

  for (const group of groups) {
    const links = (await tabviaDb.links.where("group_id").equals(group.id).toArray())
      .filter((link) => link.deleted_at === undefined)
      .sort(
        (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
      );

    if (links.length > 0) {
      await tabviaDb.links.bulkPut(links.map((link, index) => ({ ...link, sort_order: index })));
    }
  }

  const todos = (await tabviaDb.todos.toArray())
    .filter((todo) => todo.deleted_at === undefined)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));

  if (todos.length > 0) {
    await tabviaDb.todos.bulkPut(todos.map((todo, index) => ({ ...todo, sort_order: index })));
  }

  const navShortcuts = (await tabviaDb.nav_shortcuts.toArray())
    .filter((shortcut) => shortcut.deleted_at === undefined)
    .sort(
      (left, right) =>
        left.sort_order - right.sort_order ||
        left.created_at.localeCompare(right.created_at) ||
        left.id.localeCompare(right.id)
    );

  if (navShortcuts.length > 0) {
    await tabviaDb.nav_shortcuts.bulkPut(
      navShortcuts.map((shortcut, index) => ({ ...shortcut, sort_order: index }))
    );
  }
};

export const importTabviaBackup = async (
  input: unknown,
  mode: DataImportMode
): Promise<DataImportSummary> => {
  const backup = parseTabviaBackup(input);

  await tabviaDb.transaction(
    "rw",
    [
      tabviaDb.link_groups,
      tabviaDb.links,
      tabviaDb.todos,
      tabviaDb.usage_stats,
      tabviaDb.nav_shortcuts,
      tabviaDb.sync_queue
    ],
    async () => {
      if (mode === "replace") {
        await Promise.all([
          tabviaDb.link_groups.clear(),
          tabviaDb.links.clear(),
          tabviaDb.todos.clear(),
          tabviaDb.usage_stats.clear(),
          tabviaDb.nav_shortcuts.clear(),
          tabviaDb.sync_queue.clear()
        ]);
      } else {
        const importedEntityKeys = new Set([
          ...backup.data.link_groups.map((group) => `link_group:${group.id}`),
          ...backup.data.links.map((link) => `link:${link.id}`),
          ...backup.data.todos.map((todo) => `todo:${todo.id}`),
          ...backup.data.usage_stats.map((stat) => `usage_stat:${stat.id}`),
          ...backup.data.nav_shortcuts.map((shortcut) => `nav_shortcut:${shortcut.id}`)
        ]);
        const staleQueueItemIds = (await tabviaDb.sync_queue.toArray())
          .filter((item) => importedEntityKeys.has(`${item.entity_type}:${item.entity_id}`))
          .map((item) => item.id);

        if (staleQueueItemIds.length > 0) {
          await tabviaDb.sync_queue.bulkDelete(staleQueueItemIds);
        }
      }

      if (backup.data.link_groups.length > 0) {
        await tabviaDb.link_groups.bulkPut(backup.data.link_groups);
      }
      if (backup.data.links.length > 0) {
        await tabviaDb.links.bulkPut(backup.data.links);
      }
      if (backup.data.todos.length > 0) {
        await tabviaDb.todos.bulkPut(backup.data.todos);
      }
      if (backup.data.usage_stats.length > 0) {
        await tabviaDb.usage_stats.bulkPut(backup.data.usage_stats);
      }
      if (backup.data.nav_shortcuts.length > 0) {
        await tabviaDb.nav_shortcuts.bulkPut(backup.data.nav_shortcuts);
      }

      await normalizeImportedSortOrders();
    }
  );

  return {
    link_groups: backup.data.link_groups.length,
    links: backup.data.links.length,
    todos: backup.data.todos.length,
    usage_stats: backup.data.usage_stats.length,
    nav_shortcuts: backup.data.nav_shortcuts.length
  };
};
