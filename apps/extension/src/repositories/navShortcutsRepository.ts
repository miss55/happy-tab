import { tabviaDb } from "@/db/tabviaDb";
import type { CreateNavShortcutInput, NavShortcut, UpdateNavShortcutInput } from "@/types/navShortcuts";

const nowIso = () => new Date().toISOString();

const createId = () => crypto.randomUUID();

const normalizeWebUrl = (url: string) => {
  const trimmed = url.trim();

  if (!trimmed) {
    throw new Error("URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;

  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("URL is required.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL is required.");
  }

  return parsed.toString();
};

const normalizeIconUrl = (url?: string) => {
  const trimmed = url?.trim();

  if (!trimmed) {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("error.navIcon");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("error.navIcon");
  }

  return parsed.toString();
};

const titleFromUrl = (url: string) => {
  const hostname = new URL(url).hostname.replace(/^www\./i, "");
  return hostname || url;
};

const activeShortcuts = async () =>
  (await tabviaDb.nav_shortcuts.toArray()).filter((shortcut) => shortcut.deleted_at === undefined);

export const listNavShortcuts = async (): Promise<NavShortcut[]> => {
  const shortcuts = await activeShortcuts();
  return shortcuts.sort((left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at));
};

export const createNavShortcut = async (input: CreateNavShortcutInput): Promise<NavShortcut> => {
  const url = normalizeWebUrl(input.url);
  const existing = (await activeShortcuts()).find((shortcut) => shortcut.url === url);

  if (existing) {
    throw new Error("error.navDuplicate");
  }

  const title = input.title?.trim() || titleFromUrl(url);
  const shortcuts = await activeShortcuts();
  const shortcut: NavShortcut = {
    id: createId(),
    title,
    url,
    favicon_url: normalizeIconUrl(input.favicon_url),
    sort_order: shortcuts.reduce((max, item) => Math.max(max, item.sort_order), -1) + 1,
    created_at: nowIso(),
    updated_at: nowIso()
  };

  await tabviaDb.nav_shortcuts.add(shortcut);
  return shortcut;
};

export const updateNavShortcut = async (input: UpdateNavShortcutInput): Promise<void> => {
  const current = await tabviaDb.nav_shortcuts.get(input.id);

  if (!current || current.deleted_at) {
    throw new Error("error.updateNav");
  }

  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  const url = normalizeWebUrl(input.url);
  const duplicate = (await activeShortcuts()).find((shortcut) => shortcut.id !== input.id && shortcut.url === url);

  if (duplicate) {
    throw new Error("error.navDuplicate");
  }

  await tabviaDb.nav_shortcuts.update(input.id, {
    title,
    url,
    favicon_url: normalizeIconUrl(input.favicon_url),
    updated_at: nowIso()
  });
};

export const softDeleteNavShortcut = async (shortcutId: string): Promise<void> => {
  const timestamp = nowIso();
  await tabviaDb.nav_shortcuts.update(shortcutId, {
    deleted_at: timestamp,
    updated_at: timestamp
  });
};

export const restoreNavShortcut = async (shortcutId: string): Promise<void> => {
  await tabviaDb.transaction("rw", tabviaDb.nav_shortcuts, async () => {
    const current = await tabviaDb.nav_shortcuts.get(shortcutId);
    if (!current?.deleted_at) return;

    const active = await listNavShortcuts();
    if (active.some((shortcut) => shortcut.url === current.url)) {
      throw new Error("error.navDuplicate");
    }

    const nextIndex = active.findIndex((shortcut) => shortcut.sort_order >= current.sort_order);
    active.splice(nextIndex < 0 ? active.length : nextIndex, 0, current);
    const timestamp = nowIso();
    await tabviaDb.nav_shortcuts.update(shortcutId, { deleted_at: undefined, updated_at: timestamp });
    await Promise.all(active.map((shortcut, index) =>
      tabviaDb.nav_shortcuts.update(shortcut.id, { sort_order: index, updated_at: timestamp })
    ));
  });
};

export const reorderNavShortcuts = async (shortcutIds: string[]): Promise<void> => {
  const timestamp = nowIso();

  await tabviaDb.transaction("rw", tabviaDb.nav_shortcuts, async () => {
    await Promise.all(
      shortcutIds.map((shortcutId, index) =>
        tabviaDb.nav_shortcuts.update(shortcutId, {
          sort_order: index,
          updated_at: timestamp
        })
      )
    );
  });
};
