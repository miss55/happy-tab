import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  getLocalStorageValue: vi.fn(),
  setLocalStorageValue: vi.fn()
}));

const assetMocks = vi.hoisted(() => ({
  getThemeBackgroundAsset: vi.fn(),
  saveThemeBackgroundAsset: vi.fn(),
  deleteThemeBackgroundAsset: vi.fn()
}));

vi.mock("@/services/chromeStorage", () => storageMocks);
vi.mock("@/repositories/themeAssetRepository", () => assetMocks);

import {
  buildCustomThemeVariables,
  defaultCustomTheme,
  defaultThemeBackground,
  defaultThemeEffects,
  getContrastRatio,
  initializeTheme,
  normalizeThemeSettings,
  resolveThemeMode,
  setThemeBackgroundImage,
  setThemeMode,
  setThemePalette,
  setThemeStyle,
  updateThemeBackground,
  updateCustomTheme,
  useTheme
} from "@/services/theme";
import { ThemeBackgroundError, type ThemeBackgroundAsset } from "@/types/theme";

describe("theme", () => {
  beforeEach(() => {
    storageMocks.getLocalStorageValue.mockReset();
    storageMocks.setLocalStorageValue.mockReset();
    storageMocks.getLocalStorageValue.mockResolvedValue(undefined);
    storageMocks.setLocalStorageValue.mockResolvedValue(undefined);
    assetMocks.getThemeBackgroundAsset.mockReset();
    assetMocks.saveThemeBackgroundAsset.mockReset();
    assetMocks.deleteThemeBackgroundAsset.mockReset();
    assetMocks.getThemeBackgroundAsset.mockResolvedValue(undefined);
    assetMocks.deleteThemeBackgroundAsset.mockResolvedValue(undefined);
  });

  it("normalizes unsupported settings and invalid colors", () => {
    expect(
      normalizeThemeSettings({
        mode: "unknown",
        custom: {
          background: "red",
          surface: "#ABCDEF",
          text: "#123456",
          accent: "#xyzxyz"
        }
      })
    ).toEqual({
      style: "soft",
      mode: "system",
      palette: "style",
      custom: {
        ...defaultCustomTheme,
        surface: "#abcdef",
        text: "#123456"
      },
      background: defaultThemeBackground,
      effects: defaultThemeEffects
    });
  });

  it("maps refined style and custom mode from legacy settings", () => {
    const settings = normalizeThemeSettings({
      style: "refined",
      mode: "custom",
      custom: {
        background: "#101827",
        surface: "#172033",
        text: "#f8fafc",
        accent: "#f97316"
      }
    });

    expect(settings.style).toBe("soft");
    expect(settings.mode).toBe("dark");
    expect(settings.palette).toBe("custom");
    expect(settings.custom.accent).toBe("#f97316");
  });

  it("keeps an explicitly chosen named palette", () => {
    expect(
      normalizeThemeSettings({
        style: "glass",
        palette: "purple"
      }).palette
    ).toBe("purple");
  });

  it("migrates a wallpaper preset into independent style and background", () => {
    expect(
      normalizeThemeSettings({
        preset: "aurora-forest",
        mode: "light",
        style: "refined"
      })
    ).toMatchObject({
      style: "glass",
      mode: "dark",
      palette: "style",
      background: {
        type: "wallpaper",
        wallpaperId: "aurora-forest"
      }
    });
  });

  it("normalizes background display settings to supported bounds", () => {
    expect(
      normalizeThemeSettings({
        background: {
          type: "custom-image",
          enabled: true,
          fit: "stretch",
          overlay: 100,
          blur: -4
        }
      }).background
    ).toEqual({
      type: "solid",
      wallpaperId: "morning-lake",
      fit: "cover",
      overlay: 80,
      blur: 0
    });
  });

  it("corrects custom text with insufficient contrast", () => {
    const settings = normalizeThemeSettings({
      palette: "custom",
      custom: {
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#ffffff",
        accent: "#2563eb"
      }
    });

    expect(settings.custom.text).toBe("#111827");
    expect(getContrastRatio(settings.custom.text, settings.custom.surface)).toBeGreaterThan(4.5);
  });

  it("builds semantic CSS variables with a readable accent contrast", () => {
    expect(buildCustomThemeVariables(defaultCustomTheme)).toMatchObject({
      "--theme-bg": "#f5f7fb",
      "--theme-surface": "#ffffff",
      "--theme-accent": "#2563eb",
      "--theme-accent-contrast": "#ffffff"
    });
  });

  it("forces OLED to dark while leaving other styles on the requested mode", () => {
    expect(resolveThemeMode("light", "oled")).toBe("dark");
    expect(resolveThemeMode("light", "soft")).toBe("light");
  });

  it("loads a saved theme and persists style, mode, palette, and custom changes", async () => {
    storageMocks.getLocalStorageValue.mockResolvedValue({
      mode: "dark",
      custom: defaultCustomTheme
    });

    await initializeTheme();
    expect(useTheme().settings.value.mode).toBe("dark");
    expect(useTheme().settings.value.style).toBe("soft");
    expect(useTheme().settings.value.palette).toBe("style");

    await setThemeStyle("glass");
    expect(storageMocks.setLocalStorageValue).toHaveBeenLastCalledWith(
      "happy_tab_theme",
      expect.objectContaining({ style: "glass", mode: "dark" })
    );

    await setThemeMode("light");
    expect(storageMocks.setLocalStorageValue).toHaveBeenLastCalledWith(
      "happy_tab_theme",
      expect.objectContaining({ mode: "light", style: "glass" })
    );

    await setThemePalette("style");
    expect(storageMocks.setLocalStorageValue).toHaveBeenLastCalledWith(
      "happy_tab_theme",
      expect.objectContaining({ palette: "style", style: "glass" })
    );

    await setThemePalette("purple");
    expect(storageMocks.setLocalStorageValue).toHaveBeenLastCalledWith(
      "happy_tab_theme",
      expect.objectContaining({ palette: "purple" })
    );

    await updateCustomTheme({
      background: "#101827",
      surface: "#172033",
      text: "#f8fafc",
      accent: "#f97316"
    });
    expect(storageMocks.setLocalStorageValue).toHaveBeenLastCalledWith(
      "happy_tab_theme",
      expect.objectContaining({
        palette: "custom",
        style: "glass",
        custom: expect.objectContaining({ accent: "#f97316" })
      })
    );
  });

  it("loads and updates a stored local background image", async () => {
    const asset: ThemeBackgroundAsset = {
      id: "background",
      blob: new Blob(["image"], { type: "image/png" }),
      file_name: "wallpaper.png",
      mime_type: "image/png",
      size: 5,
      updated_at: "2026-07-30T00:00:00.000Z"
    };
    storageMocks.getLocalStorageValue.mockResolvedValue({
      mode: "dark",
      custom: defaultCustomTheme,
      background: {
        enabled: true,
        fit: "contain",
        overlay: 45,
        blur: 2
      }
    });
    assetMocks.getThemeBackgroundAsset.mockResolvedValue(asset);

    await initializeTheme();

    expect(useTheme().backgroundAsset.value).toEqual(asset);
    expect(useTheme().settings.value.background).toMatchObject({
      type: "custom-image",
      fit: "contain"
    });

    await updateThemeBackground({ overlay: 55 });
    expect(storageMocks.setLocalStorageValue).toHaveBeenLastCalledWith(
      "happy_tab_theme",
      expect.objectContaining({
        background: expect.objectContaining({ overlay: 55, type: "custom-image" })
      })
    );
  });

  it("ignores an invalid stored background asset without blocking startup", async () => {
    storageMocks.getLocalStorageValue.mockResolvedValue({
      mode: "dark",
      custom: defaultCustomTheme,
      background: {
        enabled: true,
        fit: "cover",
        overlay: 30,
        blur: 0
      }
    });
    assetMocks.getThemeBackgroundAsset.mockResolvedValue({
      id: "background",
      blob: new Blob(["<svg></svg>"], { type: "image/svg+xml" }),
      file_name: "background.png",
      mime_type: "image/png",
      size: 11,
      updated_at: "2026-07-30T00:00:00.000Z"
    });

    await initializeTheme();

    expect(useTheme().backgroundAsset.value).toBeNull();
    expect(useTheme().settings.value.background.type).toBe("solid");
  });

  it("validates background files before writing them", async () => {
    await initializeTheme();

    await expect(
      setThemeBackgroundImage({
        name: "background.svg",
        size: 100,
        type: "image/svg+xml"
      } as File)
    ).rejects.toEqual(new ThemeBackgroundError("unsupported_type"));

    await expect(
      setThemeBackgroundImage({
        name: "large.png",
        size: 5 * 1024 * 1024 + 1,
        type: "image/png"
      } as File)
    ).rejects.toEqual(new ThemeBackgroundError("file_too_large"));

    expect(assetMocks.saveThemeBackgroundAsset).not.toHaveBeenCalled();
  });

  it("stores a valid background and enables it", async () => {
    const file = {
      name: "wallpaper.webp",
      size: 1024,
      type: "image/webp"
    } as File;
    const asset: ThemeBackgroundAsset = {
      id: "background",
      blob: new Blob(["image"], { type: "image/webp" }),
      file_name: file.name,
      mime_type: "image/webp",
      size: file.size,
      updated_at: "2026-07-30T00:00:00.000Z"
    };
    assetMocks.saveThemeBackgroundAsset.mockResolvedValue(asset);
    await initializeTheme();

    await setThemeBackgroundImage(file);

    expect(assetMocks.saveThemeBackgroundAsset).toHaveBeenCalledWith({
      blob: file,
      fileName: "wallpaper.webp",
      mimeType: "image/webp",
      size: 1024
    });
    expect(useTheme().backgroundAsset.value).toEqual(asset);
    expect(useTheme().settings.value.background.type).toBe("custom-image");
  });

  it("rolls back a new background when its display setting cannot be saved", async () => {
    const file = {
      name: "wallpaper.png",
      size: 1024,
      type: "image/png"
    } as File;
    assetMocks.saveThemeBackgroundAsset.mockResolvedValue({
      id: "background",
      blob: new Blob(["image"], { type: "image/png" }),
      file_name: file.name,
      mime_type: "image/png",
      size: file.size,
      updated_at: "2026-07-30T00:00:00.000Z"
    } satisfies ThemeBackgroundAsset);
    await initializeTheme();
    storageMocks.setLocalStorageValue.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(setThemeBackgroundImage(file)).rejects.toThrow("storage unavailable");

    expect(assetMocks.deleteThemeBackgroundAsset).toHaveBeenCalledOnce();
    expect(useTheme().backgroundAsset.value).toBeNull();
    expect(useTheme().settings.value.background.type).toBe("solid");
  });

  it("rolls back the active theme when persistence fails", async () => {
    storageMocks.getLocalStorageValue.mockResolvedValue({
      mode: "dark",
      custom: defaultCustomTheme
    });
    await initializeTheme();
    storageMocks.setLocalStorageValue.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(setThemeMode("light")).rejects.toThrow("storage unavailable");
    expect(useTheme().settings.value.mode).toBe("dark");
  });
});
