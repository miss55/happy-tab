import {
  createTabviaBackup,
  importTabviaBackup,
  parseTabviaBackupJson
} from "@/repositories/dataPortabilityRepository";
import type { DataImportMode, TabviaBackup } from "@/types/dataPortability";
import { DataBackupError } from "@/types/dataPortability";

export const MAX_BACKUP_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const serializeTabviaBackup = (backup: TabviaBackup) => JSON.stringify(backup, null, 2);

export const createBackupFileName = (exportedAt: string) => {
  const date = exportedAt.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `tabvia-backup-${date}.json`;
};

export const downloadTabviaBackup = async () => {
  const backup = await createTabviaBackup();
  const blob = new Blob([serializeTabviaBackup(backup)], { type: "application/json" });
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

export const readTabviaBackupFile = async (file: File) => {
  if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
    throw new DataBackupError("file_too_large");
  }

  return parseTabviaBackupJson(await file.text());
};

export const restoreTabviaBackup = (backup: TabviaBackup, mode: DataImportMode) =>
  importTabviaBackup(backup, mode);
