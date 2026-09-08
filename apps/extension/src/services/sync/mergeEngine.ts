import type { LinkGroup, SavedLink } from "@/types/links";
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
  link_groups: LinkGroup[];
  links: SavedLink[];
  todos: TodoItem[];
}

export const mergeSnapshots = (
  localData: MergedSnapshotData,
  remoteSnapshot: SyncSnapshot
): MergedSnapshotData => {
  const mergedGroups = mergeEntities(localData.link_groups, remoteSnapshot.data?.link_groups || []);
  const mergedLinks = mergeEntities(localData.links, remoteSnapshot.data?.links || []);
  const mergedTodos = mergeEntities(localData.todos, remoteSnapshot.data?.todos || []);

  return {
    link_groups: mergedGroups,
    links: mergedLinks,
    todos: mergedTodos
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
