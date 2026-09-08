import { happyTabDb } from "@/db/happyTabDb";
import type {
  CreateSyncQueueItemInput,
  SyncQueueItem,
  SyncQueueStatus,
  UpdateSyncQueueItemInput
} from "@/types/syncQueue";

const nowIso = () => new Date().toISOString();

const createId = () => crypto.randomUUID();

export const listSyncQueueItems = async (status?: SyncQueueStatus): Promise<SyncQueueItem[]> => {
  const items = (await happyTabDb.sync_queue.toArray()).filter((item) => item.deleted_at === undefined);
  const filteredItems = status ? items.filter((item) => item.status === status) : items;
  return filteredItems.sort((a, b) => a.created_at.localeCompare(b.created_at));
};

export const getSyncQueueItem = async (syncQueueItemId: string): Promise<SyncQueueItem | undefined> => {
  const item = await happyTabDb.sync_queue.get(syncQueueItemId);
  return item?.deleted_at ? undefined : item;
};

export const createSyncQueueItem = async (input: CreateSyncQueueItemInput): Promise<SyncQueueItem> => {
  const timestamp = nowIso();
  const item: SyncQueueItem = {
    id: createId(),
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    operation: input.operation,
    payload: input.payload,
    status: "pending",
    retry_count: 0,
    created_at: timestamp,
    updated_at: timestamp
  };

  await happyTabDb.sync_queue.add(item);
  return item;
};

export const updateSyncQueueItem = async (input: UpdateSyncQueueItemInput): Promise<void> => {
  await happyTabDb.sync_queue.update(input.id, {
    status: input.status,
    retry_count: input.retry_count,
    error_message: input.error_message,
    processed_at: input.processed_at,
    updated_at: nowIso()
  });
};

export const softDeleteSyncQueueItem = async (syncQueueItemId: string): Promise<void> => {
  const timestamp = nowIso();

  await happyTabDb.sync_queue.update(syncQueueItemId, {
    deleted_at: timestamp,
    updated_at: timestamp
  });
};
