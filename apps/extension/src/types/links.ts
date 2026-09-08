export interface LinkGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SavedLink {
  id: string;
  group_id: string;
  title: string;
  url: string;
  description?: string;
  favicon_url?: string;
  tags?: string;
  sort_order: number;
  open_count: number;
  last_opened_at?: string;
  source?: "manual" | "browser_tab" | "preset";
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type Link = SavedLink;

export interface LinkGroupWithLinks extends LinkGroup {
  links: SavedLink[];
}

export interface CreateLinkGroupInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateSavedLinkInput {
  group_id: string;
  title: string;
  url: string;
  description?: string;
  favicon_url?: string;
  tags?: string;
  source?: "manual" | "browser_tab" | "preset";
}

export type CreateLinkInput = CreateSavedLinkInput;

export interface UpdateLinkGroupInput {
  id: string;
  name: string;
}

export interface UpdateSavedLinkInput {
  id: string;
  group_id: string;
  title: string;
  url: string;
}

export type UpdateLinkInput = UpdateSavedLinkInput;

export interface ReorderLinkGroupsInput {
  group_ids: string[];
}

export interface ReorderLinksInput {
  groups: Array<{
    group_id: string;
    link_ids: string[];
  }>;
}
