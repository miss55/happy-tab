import { readonly, ref } from "vue";
import {
  deleteThemeBackgroundAsset,
  getThemeBackgroundAsset,
  saveThemeBackgroundAsset
} from "@/repositories/themeAssetRepository";
import { getLocalStorageValue, setLocalStorageValue } from "@/services/chromeStorage";
import { getBuiltInWallpaper } from "@/services/themePresets";
import {
  ThemeBackgroundError,
  themeBackgroundFits,
  themeBackgroundMimeTypes,
  themeBackgroundTypes,
  themeModes,
  themePalettes,
  themeStyles,
  wallpaperIds,
  type CustomThemeColors,
  type ThemeBackgroundAsset,
  type ThemeBackgroundMimeType,
  type ThemeBackgroundSettings,
  type ThemeEffectSettings,
  type ThemeMode,
  type ThemePalette,
  type ThemeSettings,
  type ThemeStyle,
  type ThemeSurfaceKind,
  type WallpaperId
} from "@/types/theme";

const THEME_STORAGE_KEY = "happy_tab_theme";
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
export const MAX_THEME_BACKGROUND_FILE_SIZE = 5 * 1024 * 1024;

const INLINE_THEME_PROPERTIES = [
  "--theme-accent",
  "--theme-accent-strong",
  "--theme-accent-soft",
  "--theme-accent-contrast",
  "--theme-bg",
  "--theme-surface",
  "--theme-surface-soft",
  "--theme-text",
  "--theme-surface-text",
  "--theme-muted",
  "--theme-border",
  "--theme-danger",
  "--theme-danger-soft",
  "--theme-success",
  "--theme-success-soft",
  "--theme-overlay",
  "--theme-topbar",
  "--theme-shadow"
] as const;

const LEGACY_PRESET_IDS = [
  "classic",
  "morning-lake",
  "aurora-forest",
  "coral-flow",
  "lavender-sky",
  "custom"
] as const;

export const defaultCustomTheme: CustomThemeColors = {
  background: "#f5f7fb",
  surface: "#ffffff",
  text: "#111827",
  accent: "#2563eb"
};

export const defaultThemeBackground: ThemeBackgroundSettings = {
  type: "solid",
  wallpaperId: "morning-lake",
  fit: "cover",
  overlay: 30,
  blur: 0
};

export const defaultThemeEffects: ThemeEffectSettings = {
  animation: true,
  blur: true,
  glow: false
};

export const defaultThemeSettings: ThemeSettings = {
  style: "soft",
  mode: "system",
  palette: "style",
  custom: { ...defaultCustomTheme },
  background: { ...defaultThemeBackground },
  effects: { ...defaultThemeEffects }
};

type RGB = [number, number, number];

const hexToRgb = (color: string): RGB => [
  Number.parseInt(color.slice(1, 3), 16),
  Number.parseInt(color.slice(3, 5), 16),
  Number.parseInt(color.slice(5, 7), 16)
];

const rgbToHex = ([red, green, blue]: RGB) =>
  `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const mixColors = (first: string, second: string, secondWeight: number) => {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  return rgbToHex(
    firstRgb.map(
      (channel, index) => channel * (1 - secondWeight) + secondRgb[index] * secondWeight
    ) as RGB
  );
};

const relativeLuminance = (color: string) => {
  const [red, green, blue] = hexToRgb(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const getContrastRatio = (first: string, second: string) => {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
};

const bestReadableText = (background: string) => {
  const candidates = ["#111827", "#f8fafc"] as const;
  return [...candidates].sort(
    (first, second) =>
      getContrastRatio(second, background) - getContrastRatio(first, background)
  )[0];
};

const normalizeHexColor = (value: unknown, fallback: string) =>
  typeof value === "string" && HEX_COLOR_PATTERN.test(value)
    ? value.toLocaleLowerCase()
    : fallback;

const normalizeCustomTheme = (value: unknown): CustomThemeColors => {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const background = normalizeHexColor(record.background, defaultCustomTheme.background);
  const surface = normalizeHexColor(record.surface, defaultCustomTheme.surface);
  let text = normalizeHexColor(record.text, defaultCustomTheme.text);
  const accent = normalizeHexColor(record.accent, defaultCustomTheme.accent);

  if (getContrastRatio(text, background) < 3) {
    text = bestReadableText(background);
  }

  return { background, surface, text, accent };
};

const normalizeBoundedNumber = (
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, Math.round(value)))
    : fallback;

const normalizeStyle = (value: unknown): ThemeStyle => {
  if (value === "refined") {
    return "soft";
  }

  return themeStyles.includes(value as ThemeStyle) ? (value as ThemeStyle) : defaultThemeSettings.style;
};

const prefersDarkScheme = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

export const resolveThemeMode = (mode: ThemeMode, style: ThemeStyle): "light" | "dark" => {
  if (style === "oled") {
    return "dark";
  }

  if (mode !== "system") {
    return mode;
  }

  return prefersDarkScheme() ? "dark" : "light";
};

export const getThemeSurfaceKind = (style: ThemeStyle): ThemeSurfaceKind => {
  if (style === "glass") {
    return "glass";
  }

  if (style === "fluent") {
    return "acrylic";
  }

  if (style === "cyber") {
    return "neon";
  }

  return "solid";
};

const inferModeFromCustomColors = (colors: CustomThemeColors): ThemeMode =>
  relativeLuminance(colors.background) < 0.36 ? "dark" : "light";

const normalizeMode = (value: unknown, custom: CustomThemeColors): ThemeMode => {
  if (value === "custom") {
    return inferModeFromCustomColors(custom);
  }

  return themeModes.includes(value as ThemeMode) ? (value as ThemeMode) : "system";
};

const normalizePalette = (value: unknown, legacyMode: unknown): ThemePalette => {
  if (themePalettes.includes(value as ThemePalette)) {
    return value as ThemePalette;
  }

  return legacyMode === "custom" ? "custom" : defaultThemeSettings.palette;
};

const normalizeEffects = (value: unknown): ThemeEffectSettings => {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    animation: record.animation !== false,
    blur: record.blur !== false,
    glow: record.glow === true
  };
};

const normalizeThemeBackground = (
  value: unknown,
  options: {
    legacyPreset?: string;
    hasCustomImage: boolean;
  }
): ThemeBackgroundSettings => {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const wallpaperId = wallpaperIds.includes(record.wallpaperId as WallpaperId)
    ? (record.wallpaperId as WallpaperId)
    : wallpaperIds.includes(options.legacyPreset as WallpaperId)
      ? (options.legacyPreset as WallpaperId)
      : defaultThemeBackground.wallpaperId;

  const typeFromRecord = themeBackgroundTypes.includes(record.type as ThemeBackgroundSettings["type"])
    ? (record.type as ThemeBackgroundSettings["type"])
    : undefined;

  let type = typeFromRecord ?? defaultThemeBackground.type;

  if (!typeFromRecord) {
    if (wallpaperIds.includes(options.legacyPreset as WallpaperId)) {
      type = "wallpaper";
    } else if (record.enabled === true && options.hasCustomImage) {
      type = "custom-image";
    }
  }

  if (type === "custom-image" && !options.hasCustomImage) {
    type = "solid";
  }

  return {
    type,
    wallpaperId,
    fit: themeBackgroundFits.includes(record.fit as ThemeBackgroundSettings["fit"])
      ? (record.fit as ThemeBackgroundSettings["fit"])
      : defaultThemeBackground.fit,
    overlay: normalizeBoundedNumber(record.overlay, defaultThemeBackground.overlay, 0, 80),
    blur: normalizeBoundedNumber(record.blur, defaultThemeBackground.blur, 0, 20)
  };
};

const migrateLegacyPreset = (
  record: Record<string, unknown>,
  custom: CustomThemeColors,
  hasCustomImage: boolean
): Partial<ThemeSettings> => {
  const preset = LEGACY_PRESET_IDS.includes(record.preset as (typeof LEGACY_PRESET_IDS)[number])
    ? (record.preset as (typeof LEGACY_PRESET_IDS)[number])
    : undefined;

  if (!preset || preset === "custom" || "palette" in record) {
    return {};
  }

  if (preset === "classic") {
    return {
      style: normalizeStyle(record.style),
      mode: normalizeMode(record.mode, custom),
      palette: "style",
      background: {
        ...normalizeThemeBackground(record.background, { hasCustomImage }),
        type: hasCustomImage && (record.background as { enabled?: boolean } | undefined)?.enabled
          ? "custom-image"
          : "solid"
      }
    };
  }

  const wallpaperOverlays: Record<WallpaperId, number> = {
    "morning-lake": 8,
    "aurora-forest": 24,
    "coral-flow": 14,
    "lavender-sky": 12
  };
  const wallpaperModes: Record<WallpaperId, ThemeMode> = {
    "morning-lake": "light",
    "aurora-forest": "dark",
    "coral-flow": "light",
    "lavender-sky": "light"
  };
  return {
    style: normalizeStyle(record.style) === "minimal" ? "minimal" : "glass",
    mode: wallpaperModes[preset],
    palette: "style",
    background: {
      type: "wallpaper",
      wallpaperId: preset,
      fit: "cover",
      overlay: wallpaperOverlays[preset],
      blur: 0
    }
  };
};

export const normalizeThemeSettings = (
  value: unknown,
  options: { hasCustomImage?: boolean } = {}
): ThemeSettings => {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const custom = normalizeCustomTheme(record.custom);
  const hasCustomImage = options.hasCustomImage === true;
  const migrated = migrateLegacyPreset(record, custom, hasCustomImage);
  const style = migrated.style ?? normalizeStyle(record.style);
  const mode = migrated.mode ?? normalizeMode(record.mode, custom);
  const palette = migrated.palette ?? normalizePalette(record.palette, record.mode);
  const background =
    migrated.background ??
    normalizeThemeBackground(record.background, {
      legacyPreset: typeof record.preset === "string" ? record.preset : undefined,
      hasCustomImage
    });

  return {
    style,
    mode,
    palette,
    custom,
    background,
    effects: normalizeEffects(record.effects)
  };
};

export const buildCustomThemeVariables = (colors: CustomThemeColors) => {
  const accentContrast =
    getContrastRatio(colors.accent, "#ffffff") >= 4.5 ? "#ffffff" : "#111827";
  const isDark = relativeLuminance(colors.background) < 0.36;
  const danger = isDark ? "#fda4af" : "#a62639";
  const success = isDark ? "#6ee7b7" : "#17603a";
  const surfaceText =
    getContrastRatio(colors.text, colors.surface) >= 3
      ? colors.text
      : bestReadableText(colors.surface);

  return {
    "--theme-bg": colors.background,
    "--theme-surface": colors.surface,
    "--theme-surface-soft": mixColors(colors.surface, colors.background, 0.46),
    "--theme-text": colors.text,
    "--theme-surface-text": surfaceText,
    "--theme-muted": mixColors(surfaceText, colors.surface, 0.48),
    "--theme-border": mixColors(surfaceText, colors.surface, 0.82),
    "--theme-accent": colors.accent,
    "--theme-accent-strong": mixColors(colors.accent, "#000000", 0.18),
    "--theme-accent-soft": mixColors(colors.accent, colors.surface, 0.84),
    "--theme-accent-contrast": accentContrast,
    "--theme-danger": danger,
    "--theme-danger-soft": mixColors(danger, colors.surface, 0.84),
    "--theme-success": success,
    "--theme-success-soft": mixColors(success, colors.surface, 0.84),
    "--theme-overlay": isDark ? "rgba(2, 6, 23, 0.72)" : "rgba(15, 23, 42, 0.5)",
    "--theme-topbar": `${colors.surface}f2`,
    "--theme-shadow": isDark ? "rgba(0, 0, 0, 0.36)" : "rgba(15, 23, 42, 0.14)"
  } as const;
};

const buildAccentVariables = (accent: string, isDark: boolean) => {
  const surface = isDark ? "#111827" : "#ffffff";
  const accentContrast = getContrastRatio(accent, "#ffffff") >= 4.5 ? "#ffffff" : "#111827";

  return {
    "--theme-accent": accent,
    "--theme-accent-strong": mixColors(accent, "#000000", 0.18),
    "--theme-accent-soft": isDark ? mixColors(accent, "#000000", 0.72) : mixColors(accent, surface, 0.84),
    "--theme-accent-contrast": accentContrast
  } as const;
};

const activeTheme = ref<ThemeSettings>(normalizeThemeSettings(defaultThemeSettings));
const activeBackgroundAsset = ref<ThemeBackgroundAsset | null>(null);
const activeBackgroundUrl = ref<string | null>(null);
let systemThemeMedia: MediaQueryList | null = null;

const isUsableBackgroundAsset = (
  asset: ThemeBackgroundAsset | undefined
): asset is ThemeBackgroundAsset =>
  Boolean(
    asset &&
      asset.id === "background" &&
      typeof Blob !== "undefined" &&
      asset.blob instanceof Blob &&
      asset.blob.size > 0 &&
      asset.blob.size <= MAX_THEME_BACKGROUND_FILE_SIZE &&
      asset.size === asset.blob.size &&
      typeof asset.file_name === "string" &&
      asset.file_name.length > 0 &&
      themeBackgroundMimeTypes.includes(asset.mime_type) &&
      asset.blob.type === asset.mime_type
  );

const replaceActiveBackgroundAsset = (asset: ThemeBackgroundAsset | null) => {
  if (
    activeBackgroundUrl.value &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(activeBackgroundUrl.value);
  }

  activeBackgroundAsset.value = asset;
  activeBackgroundUrl.value = null;

  if (asset && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    activeBackgroundUrl.value = URL.createObjectURL(asset.blob);
  }
};

const resolveBackgroundImage = (settings: ThemeSettings) => {
  if (settings.background.type === "wallpaper") {
    const wallpaper = getBuiltInWallpaper(settings.background.wallpaperId);
    return {
      enabled: Boolean(wallpaper),
      image: wallpaper ? `url("${wallpaper.backgroundUrl}")` : "none",
      overlay: wallpaper?.overlay ?? settings.background.overlay,
      blur: wallpaper?.blur ?? settings.background.blur,
      fit: "cover" as const
    };
  }

  if (settings.background.type === "custom-image" && activeBackgroundUrl.value) {
    return {
      enabled: true,
      image: `url("${activeBackgroundUrl.value}")`,
      overlay: settings.background.overlay,
      blur: settings.background.blur,
      fit: settings.background.fit
    };
  }

  if (settings.background.type === "gradient") {
    return {
      enabled: true,
      image:
        "linear-gradient(160deg, color-mix(in srgb, var(--theme-accent) 34%, var(--theme-bg)), var(--theme-bg) 72%)",
      overlay: 0,
      blur: 0,
      fit: "cover" as const
    };
  }

  return {
    enabled: false,
    image: "none",
    overlay: 0,
    blur: 0,
    fit: settings.background.fit
  };
};

const applyTheme = (settings: ThemeSettings) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const resolvedMode = resolveThemeMode(settings.mode, settings.style);
  const background = resolveBackgroundImage(settings);
  const isDark = resolvedMode === "dark";

  root.dataset.theme = resolvedMode;
  root.dataset.themeMode = resolvedMode;
  root.dataset.themeStyle = settings.style;
  root.dataset.themePalette = settings.palette;
  root.dataset.themeSurface = getThemeSurfaceKind(settings.style);
  root.dataset.backgroundImage = background.enabled ? "true" : "false";
  root.dataset.themeAnimation = settings.effects.animation ? "true" : "false";
  root.dataset.themeBlur = settings.effects.blur ? "true" : "false";
  root.dataset.themeGlow = settings.effects.glow ? "true" : "false";
  root.style.colorScheme = resolvedMode;
  root.style.setProperty("--theme-background-image", background.image);
  root.style.setProperty("--theme-background-fit", background.fit);
  root.style.setProperty("--theme-background-overlay", String(background.overlay / 100));
  root.style.setProperty("--theme-background-blur", `${background.blur}px`);

  for (const property of INLINE_THEME_PROPERTIES) {
    root.style.removeProperty(property);
  }

  if (settings.palette === "custom") {
    const variables = buildAccentVariables(settings.custom.accent, isDark);
    for (const [property, value] of Object.entries(variables)) {
      root.style.setProperty(property, value);
    }
  }
};

const persistTheme = async (settings: ThemeSettings) => {
  const previous = activeTheme.value;
  activeTheme.value = settings;
  applyTheme(settings);

  try {
    await setLocalStorageValue(THEME_STORAGE_KEY, settings);
  } catch (error) {
    activeTheme.value = previous;
    applyTheme(previous);
    throw error;
  }
};

const syncResolvedTheme = () => {
  if (activeTheme.value.mode === "system" || activeTheme.value.style === "oled") {
    applyTheme(activeTheme.value);
  }
};

const bindSystemThemeListener = () => {
  if (typeof window === "undefined" || systemThemeMedia) {
    return;
  }

  systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  systemThemeMedia.addEventListener("change", syncResolvedTheme);
};

export const initializeTheme = async () => {
  const [storedTheme, storedBackgroundAsset] = await Promise.all([
    getLocalStorageValue<unknown>(THEME_STORAGE_KEY).catch(() => undefined),
    getThemeBackgroundAsset().catch(() => undefined)
  ]);
  const usableBackgroundAsset = isUsableBackgroundAsset(storedBackgroundAsset)
    ? storedBackgroundAsset
    : null;
  replaceActiveBackgroundAsset(usableBackgroundAsset);
  activeTheme.value = normalizeThemeSettings(storedTheme, {
    hasCustomImage: Boolean(usableBackgroundAsset)
  });
  applyTheme(activeTheme.value);
  bindSystemThemeListener();
};

export const setThemeMode = async (mode: ThemeMode) => {
  await persistTheme(
    normalizeThemeSettings(
      {
        ...activeTheme.value,
        mode
      },
      { hasCustomImage: Boolean(activeBackgroundAsset.value) }
    )
  );
};

export const setThemeStyle = async (style: ThemeStyle) => {
  await persistTheme(
    normalizeThemeSettings(
      {
        ...activeTheme.value,
        style
      },
      { hasCustomImage: Boolean(activeBackgroundAsset.value) }
    )
  );
};

export const setThemePalette = async (palette: ThemePalette) => {
  await persistTheme(
    normalizeThemeSettings(
      {
        ...activeTheme.value,
        palette
      },
      { hasCustomImage: Boolean(activeBackgroundAsset.value) }
    )
  );
};

export const updateCustomTheme = async (custom: CustomThemeColors) => {
  await persistTheme(
    normalizeThemeSettings(
      {
        ...activeTheme.value,
        palette: "custom",
        custom
      },
      { hasCustomImage: Boolean(activeBackgroundAsset.value) }
    )
  );
};

export const updateThemeBackground = async (background: Partial<ThemeBackgroundSettings>) => {
  const nextType = background.type ?? activeTheme.value.background.type;
  await persistTheme(
    normalizeThemeSettings(
      {
        ...activeTheme.value,
        background: {
          ...activeTheme.value.background,
          ...background,
          type:
            nextType === "custom-image" && !activeBackgroundAsset.value
              ? "solid"
              : nextType
        }
      },
      { hasCustomImage: Boolean(activeBackgroundAsset.value) }
    )
  );
};

export const updateThemeEffects = async (effects: Partial<ThemeEffectSettings>) => {
  await persistTheme(
    normalizeThemeSettings(
      {
        ...activeTheme.value,
        effects: {
          ...activeTheme.value.effects,
          ...effects
        }
      },
      { hasCustomImage: Boolean(activeBackgroundAsset.value) }
    )
  );
};

const validateThemeBackgroundFile = (file: File) => {
  if (file.size === 0) {
    throw new ThemeBackgroundError("empty_file");
  }

  if (file.size > MAX_THEME_BACKGROUND_FILE_SIZE) {
    throw new ThemeBackgroundError("file_too_large");
  }

  if (!themeBackgroundMimeTypes.includes(file.type as ThemeBackgroundMimeType)) {
    throw new ThemeBackgroundError("unsupported_type");
  }
};

const restoreBackgroundAsset = async (asset: ThemeBackgroundAsset | null) => {
  if (asset) {
    await saveThemeBackgroundAsset({
      blob: asset.blob,
      fileName: asset.file_name,
      mimeType: asset.mime_type,
      size: asset.size
    });
  } else {
    await deleteThemeBackgroundAsset();
  }
};

export const setThemeBackgroundImage = async (file: File) => {
  validateThemeBackgroundFile(file);
  const previousAsset = activeBackgroundAsset.value;
  const savedAsset = await saveThemeBackgroundAsset({
    blob: file,
    fileName: file.name,
    mimeType: file.type as ThemeBackgroundMimeType,
    size: file.size
  });
  replaceActiveBackgroundAsset(savedAsset);

  try {
    await updateThemeBackground({ type: "custom-image" });
  } catch (error) {
    await restoreBackgroundAsset(previousAsset).catch(() => undefined);
    replaceActiveBackgroundAsset(previousAsset);
    applyTheme(activeTheme.value);
    throw error;
  }
};

export const removeThemeBackgroundImage = async () => {
  const previousAsset = activeBackgroundAsset.value;

  if (!previousAsset) {
    if (activeTheme.value.background.type === "custom-image") {
      await updateThemeBackground({ type: "solid" });
    }
    return;
  }

  await deleteThemeBackgroundAsset();
  replaceActiveBackgroundAsset(null);

  try {
    await updateThemeBackground({
      type: activeTheme.value.background.type === "custom-image" ? "solid" : activeTheme.value.background.type
    });
  } catch (error) {
    await restoreBackgroundAsset(previousAsset).catch(() => undefined);
    replaceActiveBackgroundAsset(previousAsset);
    applyTheme(activeTheme.value);
    throw error;
  }
};

export const resetTheme = async () => {
  await persistTheme(normalizeThemeSettings(defaultThemeSettings));
};

export const useTheme = () => ({
  settings: readonly(activeTheme),
  backgroundAsset: readonly(activeBackgroundAsset),
  backgroundUrl: readonly(activeBackgroundUrl),
  setThemeMode,
  setThemeStyle,
  setThemePalette,
  updateCustomTheme,
  updateThemeBackground,
  updateThemeEffects,
  setThemeBackgroundImage,
  removeThemeBackgroundImage,
  resetTheme
});
