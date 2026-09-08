import {
  createHappyTabBackup,
  importHappyTabBackup,
  parseHappyTabBackupJson
} from "@/repositories/dataPortabilityRepository";
import type { DataImportMode, HappyTabBackupV1 } from "@/types/dataPortability";
import { DataBackupError } from "@/types/dataPortability";

export const MAX_BACKUP_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const serializeHappyTabBackup = (backup: HappyTabBackupV1) => JSON.stringify(backup, null, 2);

export const createBackupFileName = (exportedAt: string) => {
  const date = exportedAt.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `happy-tab-backup-${date}.json`;
};

export const downloadHappyTabBackup = async () => {
  const backup = await createHappyTabBackup();
  const blob = new Blob([serializeHappyTabBackup(backup)], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  try {
    anchor.href = objectUrl;
    anchor.download = createBackupFileName(backup.exported_at);
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return backup;
};

export const readHappyTabBackupFile = async (file: File) => {
  if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
    throw new DataBackupError("file_too_large");
  }

  return parseHappyTabBackupJson(await file.text());
};

export const restoreHappyTabBackup = (backup: HappyTabBackupV1, mode: DataImportMode) =>
  importHappyTabBackup(backup, mode);
