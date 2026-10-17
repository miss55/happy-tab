export interface NavShortcut {
  id: string;
  title: string;
  url: string;
  favicon_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateNavShortcutInput {
  title?: string;
  url: string;
  favicon_url?: string;
}

export interface UpdateNavShortcutInput {
  id: string;
  title: string;
  url: string;
  favicon_url?: string;
}
