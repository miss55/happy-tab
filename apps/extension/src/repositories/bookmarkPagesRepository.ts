import { tabviaDb } from "@/db/tabviaDb";
import { createDefaultBookmarkPage, DEFAULT_BOOKMARK_PAGE_ID, type BookmarkPage } from "@/types/bookmarkPages";

export const ensureBookmarkPages = async () => {
  await tabviaDb.transaction("rw", tabviaDb.bookmark_pages, tabviaDb.link_groups, async () => {
    const fallback = await tabviaDb.bookmark_pages.get(DEFAULT_BOOKMARK_PAGE_ID);
    if (!fallback || fallback.deleted_at) await tabviaDb.bookmark_pages.put(createDefaultBookmarkPage());
    const pages = new Set((await tabviaDb.bookmark_pages.toArray()).filter(page => !page.deleted_at).map(page => page.id));
    // Also handles legacy records brought in by an older extension after migration.
    await tabviaDb.link_groups.toCollection().modify(group => {
      if (group.page_id && pages.has(group.page_id)) return false;
      group.page_id = DEFAULT_BOOKMARK_PAGE_ID;
    });
  });
};

export const listBookmarkPages = async () =>
  (await tabviaDb.bookmark_pages.toArray()).filter(page => !page.deleted_at)
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));

const requirePage = async (id: string) => {
  const page = await tabviaDb.bookmark_pages.get(id);
  if (!page || page.deleted_at) throw new Error("pages.unavailable");
  return page;
};

export const createBookmarkPage = async (name: string): Promise<BookmarkPage> => {
  if (!name.trim()) throw new Error("pages.nameRequired");
  const timestamp = new Date().toISOString();
  const pages = await listBookmarkPages();
  const page = {
    id: crypto.randomUUID(), name: name.trim(),
    sort_order: Math.max(-1, ...pages.map(item => item.sort_order)) + 1,
    created_at: timestamp, updated_at: timestamp
  };
  await tabviaDb.bookmark_pages.add(page);
  return page;
};

export const renameBookmarkPage = async (id: string, name: string) => {
  if (!name.trim()) throw new Error("pages.nameRequired");
  await tabviaDb.transaction("rw", tabviaDb.bookmark_pages, async () => {
    await requirePage(id);
    await tabviaDb.bookmark_pages.update(id, { name: name.trim(), updated_at: new Date().toISOString() });
  });
};

export const deleteEmptyBookmarkPage = async (id: string) => {
  await tabviaDb.transaction("rw", tabviaDb.bookmark_pages, tabviaDb.link_groups, async () => {
    await requirePage(id);
    if (id === DEFAULT_BOOKMARK_PAGE_ID) throw new Error("pages.keepDefault");
    if (await tabviaDb.link_groups.where("page_id").equals(id).and(group => !group.deleted_at).count()) {
      throw new Error("pages.notEmpty");
    }
    const timestamp = new Date().toISOString();
    await tabviaDb.bookmark_pages.update(id, { deleted_at: timestamp, updated_at: timestamp });
  });
};

export const reorderBookmarkPages = async (ids: string[]) => {
  await tabviaDb.transaction("rw", tabviaDb.bookmark_pages, async () => {
    const pages = await listBookmarkPages();
    if (new Set(ids).size !== pages.length || ids.length !== pages.length || pages.some(page => !ids.includes(page.id))) {
      throw new Error("pages.unavailable");
    }
    const updated_at = new Date().toISOString();
    await Promise.all(ids.map((id, sort_order) => tabviaDb.bookmark_pages.update(id, { sort_order, updated_at })));
  });
};

export const moveLinkGroupToPage = async (groupId: string, pageId: string) => {
  await tabviaDb.transaction("rw", tabviaDb.bookmark_pages, tabviaDb.link_groups, async () => {
    await requirePage(pageId);
    const group = await tabviaDb.link_groups.get(groupId);
    if (!group || group.deleted_at) throw new Error("pages.unavailable");
    if (group.page_id === pageId) return;
    const groups = await tabviaDb.link_groups.where("page_id").equals(pageId).and(item => !item.deleted_at).toArray();
    await tabviaDb.link_groups.update(groupId, {
      page_id: pageId, sort_order: Math.max(-1, ...groups.map(item => item.sort_order)) + 1,
      updated_at: new Date().toISOString()
    });
  });
};
