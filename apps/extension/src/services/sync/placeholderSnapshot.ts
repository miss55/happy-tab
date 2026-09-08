import type { SyncSnapshot } from "./types";

export const PLACEHOLDER_SYNC_SNAPSHOT: SyncSnapshot = {
  version: 1,
  updated_at: "1970-01-01T00:00:00.000Z",
  device_name: "placeholder",
  data: {
    link_groups: [],
    links: [],
    todos: [],
    usage_stats: []
  }
};

export const PLACEHOLDER_SYNC_JSON = `${JSON.stringify(PLACEHOLDER_SYNC_SNAPSHOT, null, 2)}\n`;
