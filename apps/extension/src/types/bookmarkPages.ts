export interface BookmarkPage {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Shared across devices and legacy imports, so migration never creates duplicates.
export const DEFAULT_BOOKMARK_PAGE_ID = "00000000-0000-4000-8000-000000000001";

export const createDefaultBookmarkPage = (): BookmarkPage => ({
  id: DEFAULT_BOOKMARK_PAGE_ID,
  name: "",
  sort_order: 0,
  created_at: "1970-01-01T00:00:00.000Z",
  updated_at: "1970-01-01T00:00:00.000Z"
});
