import { tabviaDb } from "@/db/tabviaDb";
import type {
  ThemeBackgroundAsset,
  ThemeBackgroundMimeType
} from "@/types/theme";

const BACKGROUND_ASSET_ID = "background" as const;

export interface SaveThemeBackgroundAssetInput {
  blob: Blob;
  fileName: string;
  mimeType: ThemeBackgroundMimeType;
  size: number;
}

export const getThemeBackgroundAsset = () =>
  tabviaDb.theme_assets.get(BACKGROUND_ASSET_ID);

export const saveThemeBackgroundAsset = async ({
  blob,
  fileName,
  mimeType,
  size
}: SaveThemeBackgroundAssetInput): Promise<ThemeBackgroundAsset> => {
  const asset: ThemeBackgroundAsset = {
    id: BACKGROUND_ASSET_ID,
    blob,
    file_name: fileName,
    mime_type: mimeType,
    size,
    updated_at: new Date().toISOString()
  };

  await tabviaDb.theme_assets.put(asset);
  return asset;
};

export const deleteThemeBackgroundAsset = () =>
  tabviaDb.theme_assets.delete(BACKGROUND_ASSET_ID);
