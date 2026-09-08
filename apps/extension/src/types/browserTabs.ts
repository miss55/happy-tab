export type BrowserWindowType = "normal" | "popup" | "panel" | "app" | "devtools";

export interface BrowserTab {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
  pinned: boolean;
}

export interface BrowserWindowGroup {
  id: number;
  focused: boolean;
  type: BrowserWindowType;
  tabs: BrowserTab[];
}
