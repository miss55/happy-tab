import Dexie, { type Table } from "dexie";
import type { LinkGroup, SavedLink } from "@/types/links";
import type { SyncQueueItem } from "@/types/syncQueue";
import type { ThemeBackgroundAsset } from "@/types/theme";
import type { TodoItem } from "@/types/todos";
import type { UsageStat } from "@/types/usageStats";

class HappyTabDb extends Dexie {
  link_groups!: Table<LinkGroup, string>;
  links!: Table<SavedLink, string>;
  todos!: Table<TodoItem, string>;
  usage_stats!: Table<UsageStat, string>;
  sync_queue!: Table<SyncQueueItem, string>;
  theme_assets!: Table<ThemeBackgroundAsset, string>;

  constructor() {
    super("happy_tab");

    this.version(1).stores({
      linkGroups: "&id, sort_order, deleted_at, updated_at",
      links: "&id, group_id, sort_order, deleted_at, updated_at"
    });

    this.version(2).stores({
      linkGroups: "&id, sort_order, deleted_at, updated_at",
      links: "&id, group_id, sort_order, deleted_at, updated_at",
      todos: "&id, completed, sort_order, deleted_at, updated_at"
    });

    // Keep the copy and deletion in separate versions so upgrades from v1/v2
    // can read the legacy table before it is removed.
    this.version(3)
      .stores({
        link_groups: "&id, sort_order, deleted_at, updated_at",
        links: "&id, group_id, sort_order, deleted_at, updated_at",
        todos: "&id, completed, sort_order, deleted_at, updated_at",
        usage_stats: "&id, target_type, target_id, deleted_at, updated_at",
        sync_queue: "&id, entity_type, entity_id, status, created_at, deleted_at"
      })
      .upgrade(async (transaction) => {
        const legacyGroups = await transaction.table<LinkGroup, string>("linkGroups").toArray();

        if (legacyGroups.length > 0) {
          await transaction.table<LinkGroup, string>("link_groups").bulkPut(legacyGroups);
        }
      });

    this.version(4).stores({
      linkGroups: null
    });

    this.version(5).stores({
      theme_assets: "&id, updated_at"
    });
  }
}

export const happyTabDb = new HappyTabDb();
