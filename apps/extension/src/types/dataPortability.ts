import type { LinkGroup, SavedLink } from "@/types/links";
import type { TodoItem } from "@/types/todos";
import type { UsageStat } from "@/types/usageStats";

export const HAPPY_TAB_BACKUP_FORMAT = "happy-tab-backup";
export const HAPPY_TAB_BACKUP_VERSION = 1;

export type DataImportMode = "merge" | "replace";

export interface HappyTabBackupV1 {
  format: typeof HAPPY_TAB_BACKUP_FORMAT;
  version: typeof HAPPY_TAB_BACKUP_VERSION;
  exported_at: string;
  data: {
    link_groups: LinkGroup[];
    links: SavedLink[];
    todos: TodoItem[];
    usage_stats: UsageStat[];
  };
}

export interface DataImportSummary {
  link_groups: number;
  links: number;
  todos: number;
  usage_stats: number;
}

export type DataBackupErrorCode =
  | "file_too_large"
  | "invalid_json"
  | "invalid_format"
  | "unsupported_version"
  | "invalid_data"
  | "unsafe_url";

export class DataBackupError extends Error {
  constructor(
    public readonly code: DataBackupErrorCode,
    public readonly path?: string
  ) {
    super(path ? `${code}: ${path}` : code);
    this.name = "DataBackupError";
  }
}
