export const themeModes = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof themeModes)[number];

export const themeStyles = [
  "soft",
  "minimal",
  "glass",
  "fluent",
  "oled",
  "cyber"
] as const;
export type ThemeStyle = (typeof themeStyles)[number];

export const themePalettes = ["style", "blue", "purple", "green", "orange", "custom"] as const;
export type ThemePalette = (typeof themePalettes)[number];

export const themeBackgroundTypes = ["solid", "gradient", "wallpaper", "custom-image"] as const;
export type ThemeBackgroundType = (typeof themeBackgroundTypes)[number];

export const wallpaperIds = [
  "morning-lake",
  "aurora-forest",
  "coral-flow",
  "lavender-sky"
] as const;
export type WallpaperId = (typeof wallpaperIds)[number];

export interface CustomThemeColors {
  background: string;
  surface: string;
  text: string;
  accent: string;
}

export const themeBackgroundFits = ["cover", "contain"] as const;
export type ThemeBackgroundFit = (typeof themeBackgroundFits)[number];

export const themeBackgroundMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type ThemeBackgroundMimeType = (typeof themeBackgroundMimeTypes)[number];

export interface ThemeBackgroundSettings {
  type: ThemeBackgroundType;
  wallpaperId: WallpaperId;
  fit: ThemeBackgroundFit;
  overlay: number;
  blur: number;
}

export interface ThemeEffectSettings {
  animation: boolean;
  blur: boolean;
  glow: boolean;
}

export interface ThemeBackgroundAsset {
  id: "background";
  blob: Blob;
  file_name: string;
  mime_type: ThemeBackgroundMimeType;
  size: number;
  updated_at: string;
}

export interface ThemeSettings {
  style: ThemeStyle;
  mode: ThemeMode;
  palette: ThemePalette;
  custom: CustomThemeColors;
  background: ThemeBackgroundSettings;
  effects: ThemeEffectSettings;
}

export type ThemeSurfaceKind = "solid" | "glass" | "acrylic" | "neon";

export type ThemeBackgroundErrorCode = "empty_file" | "file_too_large" | "unsupported_type";

export class ThemeBackgroundError extends Error {
  constructor(public readonly code: ThemeBackgroundErrorCode) {
    super(code);
    this.name = "ThemeBackgroundError";
  }
}
