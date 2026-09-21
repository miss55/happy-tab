import { readonly, ref } from "vue";
import { getLocalStorageValue, setLocalStorageValue } from "@/services/chromeStorage";

export const WORKSPACE_STORAGE_KEY = "happy_tab_workspace";

export type WorkspaceSettings = {
  showTodos: boolean;
};

export const defaultWorkspaceSettings: WorkspaceSettings = {
  showTodos: false
};

const activeSettings = ref<WorkspaceSettings>({ ...defaultWorkspaceSettings });

export const normalizeWorkspaceSettings = (value: unknown): WorkspaceSettings => {
  if (!value || typeof value !== "object") {
    return { ...defaultWorkspaceSettings };
  }

  const record = value as Record<string, unknown>;

  return {
    showTodos: record.showTodos === true
  };
};

const persistWorkspaceSettings = async (settings: WorkspaceSettings) => {
  activeSettings.value = settings;
  await setLocalStorageValue(WORKSPACE_STORAGE_KEY, settings);
};

export const initializeWorkspaceSettings = async () => {
  const stored = await getLocalStorageValue<unknown>(WORKSPACE_STORAGE_KEY).catch(() => undefined);
  activeSettings.value = normalizeWorkspaceSettings(stored);
};

export const setShowTodos = async (showTodos: boolean) => {
  await persistWorkspaceSettings({
    ...activeSettings.value,
    showTodos
  });
};

export const useWorkspaceSettings = () => ({
  settings: readonly(activeSettings),
  setShowTodos
});
