import type { LinkGroup, SavedLink } from "@/types/links";
import { createDefaultBookmarkPage, DEFAULT_BOOKMARK_PAGE_ID, type BookmarkPage } from "@/types/bookmarkPages";
import type { NavShortcut } from "@/types/navShortcuts";
import type { TodoItem } from "@/types/todos";
import type { SyncSnapshot } from "./types";

interface IdentifiableWithTimestamp {
  id: string;
  updated_at: string;
  deleted_at?: string;
}

const mergeEntities = <T extends IdentifiableWithTimestamp>(localList: T[], remoteList: T[]): T[] => {
  const map = new Map<string, T>();

  const processEntity = (item: T) => {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }

    const itemTime = new Date(item.updated_at).getTime() || 0;
    const existingTime = new Date(existing.updated_at).getTime() || 0;

    if (itemTime > existingTime) {
      map.set(item.id, item);
    }
  };

  localList.forEach(processEntity);
  remoteList.forEach(processEntity);

  return Array.from(map.values());
};

export interface MergedSnapshotData {
  bookmark_pages?: BookmarkPage[];
  link_groups: LinkGroup[];
  links: SavedLink[];
  todos: TodoItem[];
  nav_shortcuts?: NavShortcut[];
}

export const mergeSnapshots = (
  localData: MergedSnapshotData,
  remoteSnapshot: SyncSnapshot
): MergedSnapshotData => {
  const mergedGroups = mergeEntities(localData.link_groups, remoteSnapshot.data?.link_groups || []);
  // A legacy client can edit a group without understanding page_id. Keep known
  // ownership even when that newer legacy record wins the timestamp merge.
  const knownGroups = new Map([...remoteSnapshot.data?.link_groups || [], ...localData.link_groups]
    .filter(group => group.page_id).map(group => [group.id, group]));
  const mergedPages = mergeEntities(localData.bookmark_pages || [], remoteSnapshot.data?.bookmark_pages || []);
  if (!mergedPages.some(page => page.id === DEFAULT_BOOKMARK_PAGE_ID && !page.deleted_at)) {
    const index = mergedPages.findIndex(page => page.id === DEFAULT_BOOKMARK_PAGE_ID);
    if (index >= 0) mergedPages.splice(index, 1);
    mergedPages.push(createDefaultBookmarkPage());
  }
  const activePageIds = new Set(mergedPages.filter(page => !page.deleted_at).map(page => page.id));
  const groupsWithPages = mergedGroups.map(group => {
    const pageId = group.page_id || knownGroups.get(group.id)?.page_id || DEFAULT_BOOKMARK_PAGE_ID;
    // Empty-page deletion can race with another device moving a group into it.
    // Retain the content in Default rather than leaving an invisible orphan.
    return { ...group, page_id: activePageIds.has(pageId) ? pageId : DEFAULT_BOOKMARK_PAGE_ID };
  });
  const mergedLinks = mergeEntities(localData.links, remoteSnapshot.data?.links || []);
  const mergedTodos = mergeEntities(localData.todos, remoteSnapshot.data?.todos || []);
  const mergedShortcuts = mergeEntities(localData.nav_shortcuts || [], remoteSnapshot.data?.nav_shortcuts || []);

  return {
    bookmark_pages: mergedPages,
    link_groups: groupsWithPages,
    links: mergedLinks,
    todos: mergedTodos,
    nav_shortcuts: mergedShortcuts
  };
};

export const isRemoteSnapshotNewer = (
  localLastSyncTime: string | undefined,
  remoteSnapshot: SyncSnapshot
): boolean => {
  if (!localLastSyncTime) {
    return true;
  }
  const localTime = new Date(localLastSyncTime).getTime() || 0;
  const remoteTime = new Date(remoteSnapshot.updated_at).getTime() || 0;
  return remoteTime > localTime;
};
