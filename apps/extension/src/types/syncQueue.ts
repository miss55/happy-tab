export type SyncQueueEntityType = "link_group" | "link" | "todo" | "usage_stat";
export type SyncQueueOperation = "create" | "update" | "delete";
export type SyncQueueStatus = "pending" | "processing" | "failed" | "done";

export interface SyncQueueItem {
  id: string;
  entity_type: SyncQueueEntityType;
  entity_id: string;
  operation: SyncQueueOperation;
  payload: unknown;
  status: SyncQueueStatus;
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  deleted_at?: string;
}

export interface CreateSyncQueueItemInput {
  entity_type: SyncQueueEntityType;
  entity_id: string;
  operation: SyncQueueOperation;
  payload: unknown;
}

export interface UpdateSyncQueueItemInput {
  id: string;
  status?: SyncQueueStatus;
  retry_count?: number;
  error_message?: string;
  processed_at?: string;
}
