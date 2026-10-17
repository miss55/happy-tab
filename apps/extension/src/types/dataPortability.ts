import type { LinkGroup, SavedLink } from "@/types/links";
import type { NavShortcut } from "@/types/navShortcuts";
import type { TodoItem } from "@/types/todos";
import type { UsageStat } from "@/types/usageStats";

export const TABVIA_BACKUP_FORMAT = "happy-tab-backup";
export const TABVIA_BACKUP_VERSION = 1;

export type DataImportMode = "merge" | "replace";

export interface TabviaBackupV1 {
  format: typeof TABVIA_BACKUP_FORMAT;
  version: typeof TABVIA_BACKUP_VERSION;
  exported_at: string;
  data: {
    link_groups: LinkGroup[];
    links: SavedLink[];
    todos: TodoItem[];
    usage_stats: UsageStat[];
    nav_shortcuts: NavShortcut[];
  };
}

export interface DataImportSummary {
  link_groups: number;
  links: number;
  todos: number;
  usage_stats: number;
  nav_shortcuts: number;
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
