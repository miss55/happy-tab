import auroraForestUrl from "@/assets/themes/aurora-forest.webp?url";
import coralFlowUrl from "@/assets/themes/coral-flow.webp?url";
import lavenderSkyUrl from "@/assets/themes/lavender-sky.webp?url";
import morningLakeUrl from "@/assets/themes/morning-lake.webp?url";
import type { WallpaperId } from "@/types/theme";

export interface BuiltInWallpaper {
  id: WallpaperId;
  backgroundUrl: string;
  overlay: number;
  blur: number;
}

export const builtInWallpapers: readonly BuiltInWallpaper[] = [
  {
    id: "morning-lake",
    backgroundUrl: morningLakeUrl,
    overlay: 8,
    blur: 0
  },
  {
    id: "aurora-forest",
    backgroundUrl: auroraForestUrl,
    overlay: 24,
    blur: 0
  },
  {
    id: "coral-flow",
    backgroundUrl: coralFlowUrl,
    overlay: 14,
    blur: 0
  },
  {
    id: "lavender-sky",
    backgroundUrl: lavenderSkyUrl,
    overlay: 12,
    blur: 0
  }
] as const;

export const getBuiltInWallpaper = (wallpaperId: WallpaperId | undefined) =>
  builtInWallpapers.find((wallpaper) => wallpaper.id === wallpaperId) ?? null;
