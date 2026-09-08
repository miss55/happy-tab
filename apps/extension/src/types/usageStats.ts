export type UsageStatTargetType = "link";

export interface UsageStat {
  id: string;
  target_type: UsageStatTargetType;
  target_id: string;
  open_count: number;
  last_opened_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateUsageStatInput {
  target_type: UsageStatTargetType;
  target_id: string;
}

export interface UpdateUsageStatInput {
  id: string;
  open_count: number;
  last_opened_at?: string;
}
