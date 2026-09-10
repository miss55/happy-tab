<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import FaviconImage from "@/components/FaviconImage.vue";
import JsonBinSetupGuide from "@/components/JsonBinSetupGuide.vue";
import GistSetupGuide from "@/components/GistSetupGuide.vue";
import UpstashSetupGuide from "@/components/UpstashSetupGuide.vue";
import CloudflareSetupGuide from "@/components/CloudflareSetupGuide.vue";
import LanguageMenu from "@/components/LanguageMenu.vue";
import AboutDialog from "@/components/AboutDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import {
  activateBrowserTab,
  closeBrowserTab,
  getBrowserWindowGroups
} from "@/services/browserTabs";
import {
  downloadHappyTabBackup,
  readHappyTabBackupFile,
  restoreHappyTabBackup
} from "@/services/dataPortability";
import { useTheme } from "@/services/theme";
import { builtInWallpapers } from "@/services/themePresets";
import { useI18n, type SupportedLocale, type TranslationParams } from "@/i18n";
import type { MessageKey } from "@/i18n/messages";
import { useLinksStore } from "@/stores/linksStore";
import { useSyncStore } from "@/stores/syncStore";
import { useTodosStore } from "@/stores/todosStore";
import { providerResources } from "@/services/sync/providerResources";
import { isJsonBinConfigured } from "@/services/sync/jsonbinSetup";
import { isGistConfigured } from "@/services/sync/gistSetup";
import { isUpstashConfigured } from "@/services/sync/upstashSetup";
import { isCloudflareKvConfigured } from "@/services/sync/cloudflareSetup";
import { ensureCloudflareHostPermission } from "@/services/sync/cloudflareHostPermission";
import type { BrowserTab, BrowserWindowGroup } from "@/types/browserTabs";
import {
  DataBackupError,
  type DataImportMode,
  type DataImportSummary,
  type HappyTabBackupV1
} from "@/types/dataPortability";
import type { Link, LinkGroupWithLinks } from "@/types/links";
import type { ProviderType, SyncProviderConfig } from "@/services/sync/types";
import type { Todo } from "@/types/todos";
import {
  ThemeBackgroundError,
  type ThemeBackgroundType,
  type ThemeMode,
  type ThemePalette,
  type ThemeStyle,
  type WallpaperId
} from "@/types/theme";

const syncStore = useSyncStore();
const linksStore = useLinksStore();
const todosStore = useTodosStore();
const { formatDateTime, locale, setLocale, t } = useI18n();
const {
  settings: themeSettings,
  backgroundAsset: themeBackgroundAsset,
  setThemeMode,
  setThemeStyle,
  setThemePalette,
  updateCustomTheme,
  updateThemeBackground,
  updateThemeEffects,
  setThemeBackgroundImage,
  removeThemeBackgroundImage,
  resetTheme
} = useTheme();
const {
  config: syncConfig,
  isSyncing,
  isTesting,
  lastResult: syncLastResult,
  testStatus: syncTestStatus
} = storeToRefs(syncStore);
const {
  groups: linkGroups,
  isLoading: isLinksLoading,
  errorMessage: linksErrorMessage,
  defaultGroupId,
  linkCount
} = storeToRefs(linksStore);
const {
  todos,
  isLoading: isTodosLoading,
  errorMessage: todosErrorMessage,
  activeCount: activeTodoCount,
  completedCount: completedTodoCount
} = storeToRefs(todosStore);

const windowGroups = ref<BrowserWindowGroup[]>([]);
const isTabsLoading = ref(true);
const tabsErrorMessage = ref<MessageKey | "">("");
const localeErrorMessage = ref("");
const selectedGroupId = ref("");
const newGroupName = ref("");
const linkForm = reactive({
  title: "",
  url: ""
});
const editingGroupId = ref("");
const groupEditName = ref("");
const editingLinkId = ref("");
const draggingGroupId = ref("");
const draggingLink = ref<{ linkId: string; sourceGroupId: string } | null>(null);
type DropPlacement = "before" | "after";
const groupDropTarget = ref<{ groupId: string; placement: DropPlacement } | null>(null);
const linkDropTarget = ref<{
  groupId: string;
  linkId: string | null;
  placement: DropPlacement;
} | null>(null);
const draggingBrowserTab = ref<BrowserTab | null>(null);
const browserTabDropGroupId = ref("");
const tabSearchQuery = ref("");
const savedTabFeedback = ref<{ title: string; group: string } | null>(null);
let savedTabFeedbackTimer = 0;
const SAVED_TAB_FEEDBACK_DURATION_MS = 3000;
const confirmRequest = ref<{
  title: string;
  message: string;
  confirmLabel: string;
} | null>(null);
let confirmRequestResolver: ((confirmed: boolean) => void) | null = null;
const newTodoTitle = ref("");
const editingTodoId = ref("");
const todoEditTitle = ref("");
const draggingTodoId = ref("");
const linkEditForm = reactive({
  group_id: "",
  title: "",
  url: ""
});
const syncForm = reactive<SyncProviderConfig>({
  provider: "jsonbin",
  enabled: false,
  autoSync: false,
  syncIntervalMinutes: 15,
  encryptionKey: "",
  jsonbin: { apiKey: "", binId: "" },
  gist: { token: "", gistId: "", filename: "happy_tab_sync.json" },
  cloudflareKv: { accountId: "", namespaceId: "", apiToken: "", keyName: "happy_tab_snapshot" },
  upstashRedis: { url: "", token: "", keyName: "happy_tab_snapshot" },
  customRest: { endpointUrl: "", headersJson: "" }
});

const activeSyncProviderResources = computed(() => providerResources[syncForm.provider]);

watch(
  syncConfig,
  (newVal) => {
    if (newVal) {
      syncForm.provider = newVal.provider || "jsonbin";
      syncForm.enabled = Boolean(newVal.enabled);
      syncForm.autoSync = Boolean(newVal.autoSync);
      syncForm.syncIntervalMinutes = newVal.syncIntervalMinutes || 15;
      syncForm.encryptionKey = newVal.encryptionKey || "";
      syncForm.jsonbin = Object.assign({ apiKey: "", binId: "" }, newVal.jsonbin);
      syncForm.gist = Object.assign({ token: "", gistId: "", filename: "happy_tab_sync.json" }, newVal.gist);
      syncForm.cloudflareKv = Object.assign({ accountId: "", namespaceId: "", apiToken: "", keyName: "happy_tab_snapshot" }, newVal.cloudflareKv);
      syncForm.upstashRedis = Object.assign({ url: "", token: "", keyName: "happy_tab_snapshot" }, newVal.upstashRedis);
      syncForm.customRest = Object.assign({ endpointUrl: "", headersJson: "" }, newVal.customRest);
    }
  },
  { immediate: true, deep: true }
);

const onProviderChange = () => {
  // Provider switched
};

const saveSyncSettings = async () => {
  const shouldAskCloudflareAccess =
    syncForm.provider === "cloudflare_kv" &&
    (syncForm.enabled ||
      isCloudflareKvConfigured(
        syncForm.cloudflareKv.accountId,
        syncForm.cloudflareKv.namespaceId,
        syncForm.cloudflareKv.apiToken
      ));

  if (shouldAskCloudflareAccess) {
    await ensureCloudflareHostPermission();
  }

  await syncStore.updateConfig(syncForm);
};

const testSyncConnection = async () => {
  await saveSyncSettings();
  await syncStore.testConnection();
};

const triggerManualSync = async () => {
  await saveSyncSettings();
  await syncStore.triggerSync();
  await linksStore.loadLinks();
  await todosStore.loadTodos();
};
const isDataPanelOpen = ref(false);
const isThemePanelOpen = ref(false);
const isSyncPanelOpen = ref(false);
const isAboutPanelOpen = ref(false);
const isTodoDialogOpen = ref(false);
const todoTitleInput = ref<HTMLInputElement | null>(null);

const openSyncPanel = () => {
  isTodoDialogOpen.value = false;
  isAboutPanelOpen.value = false;
  isSyncPanelOpen.value = true;
};

const openAboutPanel = () => {
  isTodoDialogOpen.value = false;
  isSyncPanelOpen.value = false;
  isThemePanelOpen.value = false;
  isDataPanelOpen.value = false;
  isAboutPanelOpen.value = true;
};

const closeAboutPanel = () => {
  isAboutPanelOpen.value = false;
};

const openSyncFromAbout = () => {
  isAboutPanelOpen.value = false;
  openSyncPanel();
};

const closeSyncPanel = () => {
  isSyncPanelOpen.value = false;
};

const openTodoDialog = async () => {
  isSyncPanelOpen.value = false;
  isThemePanelOpen.value = false;
  isDataPanelOpen.value = false;
  isAboutPanelOpen.value = false;
  newTodoTitle.value = "";
  isTodoDialogOpen.value = true;
  await nextTick();
  todoTitleInput.value?.focus();
};

const closeTodoDialog = () => {
  isTodoDialogOpen.value = false;
  newTodoTitle.value = "";
};
const themeErrorKey = ref<MessageKey | null>(null);
const isThemeBackgroundBusy = ref(false);
const isDataTransferBusy = ref(false);
const dataImportMode = ref<DataImportMode>("merge");
const selectedImportBackup = ref<HappyTabBackupV1 | null>(null);
const selectedImportFileName = ref("");
const dataTransferNotice = ref<{
  kind: "success" | "error";
  key: MessageKey;
  params?: TranslationParams;
} | null>(null);
const themeModeOptions: Array<{
  mode: ThemeMode;
  label: MessageKey;
  description: MessageKey;
}> = [
  { mode: "system", label: "theme.system", description: "theme.systemDescription" },
  { mode: "light", label: "theme.light", description: "theme.lightDescription" },
  { mode: "dark", label: "theme.dark", description: "theme.darkDescription" }
];
const themeStyleOptions: Array<{
  style: ThemeStyle;
  label: MessageKey;
  description: MessageKey;
}> = [
  { style: "soft", label: "theme.styleSoft", description: "theme.styleSoftDescription" },
  { style: "minimal", label: "theme.styleMinimal", description: "theme.styleMinimalDescription" },
  { style: "glass", label: "theme.styleGlass", description: "theme.styleGlassDescription" },
  { style: "fluent", label: "theme.styleFluent", description: "theme.styleFluentDescription" },
  { style: "oled", label: "theme.styleOled", description: "theme.styleOledDescription" },
  { style: "cyber", label: "theme.styleCyber", description: "theme.styleCyberDescription" }
];
const themePaletteOptions: Array<{
  palette: ThemePalette;
  label: MessageKey;
  color: string;
}> = [
  { palette: "style", label: "theme.paletteStyle", color: "var(--theme-style-accent)" },
  { palette: "blue", label: "theme.paletteBlue", color: "#2563eb" },
  { palette: "purple", label: "theme.palettePurple", color: "#7c3aed" },
  { palette: "green", label: "theme.paletteGreen", color: "#059669" },
  { palette: "orange", label: "theme.paletteOrange", color: "#ea580c" },
  { palette: "custom", label: "theme.paletteCustom", color: "var(--theme-accent)" }
];
const themeBackgroundTypeOptions: Array<{
  type: ThemeBackgroundType;
  label: MessageKey;
}> = [
  { type: "solid", label: "theme.backgroundSolid" },
  { type: "gradient", label: "theme.backgroundGradient" },
  { type: "wallpaper", label: "theme.backgroundWallpaper" },
  { type: "custom-image", label: "theme.backgroundCustomImage" }
];
const themeWallpaperOptions = builtInWallpapers.map((wallpaper) => ({
  id: wallpaper.id,
  label: `theme.preset.${wallpaper.id}` as MessageKey,
  description: `theme.preset.${wallpaper.id}.description` as MessageKey,
  backgroundUrl: wallpaper.backgroundUrl
}));

const tabCount = computed(() =>
  windowGroups.value.reduce((count, windowGroup) => count + windowGroup.tabs.length, 0)
);

const filteredWindowGroups = computed(() => {
  const query = tabSearchQuery.value.trim().toLocaleLowerCase();

  if (!query) {
    return windowGroups.value;
  }

  return windowGroups.value
    .map((windowGroup) => ({
      ...windowGroup,
      tabs: windowGroup.tabs.filter(
        (tab) =>
          tab.title.toLocaleLowerCase().includes(query) ||
          tab.url.toLocaleLowerCase().includes(query)
      )
    }))
    .filter((windowGroup) => windowGroup.tabs.length > 0);
});

const windowDisplayNumber = (windowId: number) => {
  const index = windowGroups.value.findIndex((group) => group.id === windowId);
  return index >= 0 ? index + 1 : windowId;
};

const activeGroupId = computed(() => selectedGroupId.value || defaultGroupId.value);

const activeGroupName = computed(
  () => linkGroups.value.find((group) => group.id === activeGroupId.value)?.name || t("top.bookmarks")
);

const savedTabMessage = computed(() =>
  savedTabFeedback.value
    ? t("bookmarks.savedFeedback", {
        title: savedTabFeedback.value.title,
        group: savedTabFeedback.value.group
      })
    : ""
);

const dataTransferNoticeMessage = computed(() =>
  dataTransferNotice.value
    ? t(dataTransferNotice.value.key, dataTransferNotice.value.params)
    : ""
);


const getDropPlacement = (event: DragEvent) => {
  const target = event.currentTarget;

  if (!(target instanceof HTMLElement)) {
    return "before";
  }

  const rect = target.getBoundingClientRect();
  return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
};

const clearBookmarkDropTargets = () => {
  groupDropTarget.value = null;
  linkDropTarget.value = null;
  browserTabDropGroupId.value = "";
};

const setMoveDropEffect = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
};

const updateOverflowTitlePan = (event: Event) => {
  const host = event.currentTarget;

  if (!(host instanceof HTMLElement)) {
    return;
  }

  const viewport = host.querySelector<HTMLElement>("[data-title-viewport]");
  const text = host.querySelector<HTMLElement>("[data-title-text]");
  const actions = host.querySelector<HTMLElement>(".row-actions");

  if (!viewport || !text) {
    return;
  }

  const actionOverlap = actions ? actions.offsetWidth + 12 : 0;
  const distance = Math.max(0, text.scrollWidth - viewport.clientWidth + actionOverlap);
  const duration = Math.min(4800, Math.max(1400, distance * 22));
  viewport.style.setProperty("--title-pan-distance", `${distance}px`);
  viewport.style.setProperty("--title-pan-duration", `${duration}ms`);
};

const resetOverflowTitlePan = (event: Event) => {
  const host = event.currentTarget;

  if (host instanceof HTMLElement) {
    const viewport = host.querySelector<HTMLElement>("[data-title-viewport]");
    viewport?.style.removeProperty("--title-pan-distance");
    viewport?.style.removeProperty("--title-pan-duration");
  }
};

const moveAround = <T,>(
  items: T[],
  draggedId: string,
  targetId: string,
  getId: (item: T) => string,
  placement: "before" | "after"
) => {
  if (draggedId === targetId) {
    return items;
  }

  const nextItems = [...items];
  const fromIndex = nextItems.findIndex((item) => getId(item) === draggedId);
  const toIndex = nextItems.findIndex((item) => getId(item) === targetId);

  if (fromIndex < 0 || toIndex < 0) {
    return items;
  }

  const [draggedItem] = nextItems.splice(fromIndex, 1);
  const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  const insertIndex = placement === "after" ? adjustedToIndex + 1 : adjustedToIndex;
  nextItems.splice(insertIndex, 0, draggedItem);

  return nextItems;
};

const loadBrowserTabs = async () => {
  isTabsLoading.value = true;
  tabsErrorMessage.value = "";

  try {
    windowGroups.value = await getBrowserWindowGroups();
  } catch {
    tabsErrorMessage.value = "error.loadBrowserTabs";
  } finally {
    isTabsLoading.value = false;
  }
};

const refreshBrowserTabsWhenVisible = () => {
  if (document.visibilityState === "visible") {
    void loadBrowserTabs();
  }
};

const selectTab = async (tab: BrowserTab) => {
  try {
    await activateBrowserTab(tab);
  } catch {
    tabsErrorMessage.value = "error.switchBrowserTab";
  }
};

const removeTab = async (tab: BrowserTab) => {
  try {
    await closeBrowserTab(tab.id);
    await loadBrowserTabs();
  } catch {
    tabsErrorMessage.value = "error.closeBrowserTab";
  }
};

const clearSavedTabFeedback = () => {
  window.clearTimeout(savedTabFeedbackTimer);
  savedTabFeedbackTimer = 0;
  savedTabFeedback.value = null;
};

const showSavedTabFeedback = (title: string, group: string) => {
  window.clearTimeout(savedTabFeedbackTimer);
  savedTabFeedback.value = { title, group };
  savedTabFeedbackTimer = window.setTimeout(() => {
    savedTabFeedback.value = null;
    savedTabFeedbackTimer = 0;
  }, SAVED_TAB_FEEDBACK_DURATION_MS);
};

const saveBrowserTabToGroup = async (tab: BrowserTab, groupId: string) => {
  if (!groupId || !tab.url.trim()) {
    return;
  }

  clearSavedTabFeedback();
  await linksStore.saveBrowserTab(tab, groupId);
  selectedGroupId.value = groupId;

  const groupName = linkGroups.value.find((group) => group.id === groupId)?.name || t("common.group");
  showSavedTabFeedback(tab.title, groupName);
};

const saveTabAsLink = async (tab: BrowserTab) => {
  await saveBrowserTabToGroup(tab, activeGroupId.value);
};

const addLinkGroup = async () => {
  const group = await linksStore.addGroup(newGroupName.value);
  selectedGroupId.value = group.id;
  newGroupName.value = "";
};

const addCustomLink = async () => {
  if (!activeGroupId.value) {
    return;
  }

  await linksStore.addLink({
    group_id: activeGroupId.value,
    title: linkForm.title,
    url: linkForm.url
  });

  linkForm.title = "";
  linkForm.url = "";
};

const openSavedLink = async (link: Link) => {
  await linksStore.openLink(link);
};

const startEditingGroup = (group: LinkGroupWithLinks) => {
  editingLinkId.value = "";
  editingGroupId.value = group.id;
  groupEditName.value = group.name;
};

const cancelEditingGroup = () => {
  editingGroupId.value = "";
  groupEditName.value = "";
};

const toggleEditingGroup = (group: LinkGroupWithLinks) => {
  if (editingGroupId.value === group.id) {
    cancelEditingGroup();
    return;
  }

  startEditingGroup(group);
};

const saveGroupEdit = async () => {
  if (!editingGroupId.value) {
    return;
  }

  await linksStore.renameGroup(editingGroupId.value, groupEditName.value);
  cancelEditingGroup();
};

const resolveConfirmRequest = (confirmed: boolean) => {
  confirmRequestResolver?.(confirmed);
  confirmRequestResolver = null;
  confirmRequest.value = null;
};

const askConfirm = (message: string) =>
  new Promise<boolean>((resolve) => {
    confirmRequestResolver?.(false);
    confirmRequestResolver = resolve;
    confirmRequest.value = {
      title: t("common.confirm"),
      message,
      confirmLabel: t("common.confirm")
    };
  });

const deleteGroup = async (group: LinkGroupWithLinks) => {
  const confirmed = await askConfirm(
    t("bookmarks.deleteGroupConfirm", { name: group.name, count: group.links.length })
  );

  if (!confirmed) {
    return;
  }

  await linksStore.deleteGroup(group.id);

  if (selectedGroupId.value === group.id) {
    selectedGroupId.value = defaultGroupId.value;
  }
};

const startEditingLink = (link: Link) => {
  editingGroupId.value = "";
  editingLinkId.value = link.id;
  linkEditForm.group_id = link.group_id;
  linkEditForm.title = link.title;
  linkEditForm.url = link.url;
};

const cancelEditingLink = () => {
  editingLinkId.value = "";
  linkEditForm.group_id = "";
  linkEditForm.title = "";
  linkEditForm.url = "";
};

const toggleEditingLink = (link: Link) => {
  if (editingLinkId.value === link.id) {
    cancelEditingLink();
    return;
  }

  startEditingLink(link);
};

const saveLinkEdit = async () => {
  if (!editingLinkId.value) {
    return;
  }

  await linksStore.editLink({
    id: editingLinkId.value,
    group_id: linkEditForm.group_id,
    title: linkEditForm.title,
    url: linkEditForm.url
  });
  cancelEditingLink();
};

const deleteLink = async (link: Link) => {
  const confirmed = await askConfirm(t("bookmarks.deleteLinkConfirm", { name: link.title }));

  if (!confirmed) {
    return;
  }

  await linksStore.deleteLink(link.id);

  if (editingLinkId.value === link.id) {
    cancelEditingLink();
  }
};

const startGroupDrag = (event: DragEvent, group: LinkGroupWithLinks) => {
  clearBookmarkDropTargets();
  draggingGroupId.value = group.id;
  event.dataTransfer?.setData("text/plain", group.id);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const startBrowserTabDrag = (event: DragEvent, tab: BrowserTab) => {
  if (!tab.url.trim()) {
    event.preventDefault();
    return;
  }

  clearBookmarkDropTargets();
  draggingBrowserTab.value = tab;
  clearSavedTabFeedback();
  event.dataTransfer?.setData("text/plain", tab.url);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copy";
  }
};

const endBrowserTabDrag = () => {
  draggingBrowserTab.value = null;
  clearBookmarkDropTargets();
};

const handleGroupDragOver = (event: DragEvent, group: LinkGroupWithLinks) => {
  event.preventDefault();

  if (draggingBrowserTab.value) {
    browserTabDropGroupId.value = group.id;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    return;
  }

  if (draggingGroupId.value && draggingGroupId.value !== group.id) {
    groupDropTarget.value = {
      groupId: group.id,
      placement: getDropPlacement(event)
    };
    setMoveDropEffect(event);
    return;
  }

  if (draggingLink.value) {
    linkDropTarget.value = {
      groupId: group.id,
      linkId: null,
      placement: "after"
    };
    setMoveDropEffect(event);
  }
};

const handleLinkDragOver = (
  event: DragEvent,
  group: LinkGroupWithLinks,
  link: Link
) => {
  if (draggingGroupId.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (draggingBrowserTab.value) {
    browserTabDropGroupId.value = group.id;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    return;
  }

  if (!draggingLink.value || draggingLink.value.linkId === link.id) {
    return;
  }

  linkDropTarget.value = {
    groupId: group.id,
    linkId: link.id,
    placement: getDropPlacement(event)
  };
  setMoveDropEffect(event);
};

const handleLinkListDragOver = (event: DragEvent, group: LinkGroupWithLinks) => {
  if (draggingGroupId.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (draggingBrowserTab.value) {
    browserTabDropGroupId.value = group.id;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    return;
  }

  if (draggingLink.value) {
    linkDropTarget.value = {
      groupId: group.id,
      linkId: null,
      placement: "after"
    };
    setMoveDropEffect(event);
  }
};

const saveDraggedBrowserTab = async (targetGroup: LinkGroupWithLinks) => {
  const tab = draggingBrowserTab.value;

  if (!tab) {
    return false;
  }

  draggingBrowserTab.value = null;
  clearBookmarkDropTargets();
  await saveBrowserTabToGroup(tab, targetGroup.id);
  return true;
};

const dropGroup = async (event: DragEvent, targetGroup: LinkGroupWithLinks) => {
  event.preventDefault();

  if (await saveDraggedBrowserTab(targetGroup)) {
    return;
  }

  if (draggingLink.value) {
    await dropLink(targetGroup, undefined, event);
    return;
  }

  if (!draggingGroupId.value || draggingGroupId.value === targetGroup.id) {
    draggingGroupId.value = "";
    clearBookmarkDropTargets();
    return;
  }

  const orderedGroups = moveAround(
    linkGroups.value,
    draggingGroupId.value,
    targetGroup.id,
    (group) => group.id,
    groupDropTarget.value?.groupId === targetGroup.id
      ? groupDropTarget.value.placement
      : getDropPlacement(event)
  );

  await linksStore.sortGroups(orderedGroups.map((group) => group.id));
  draggingGroupId.value = "";
  clearBookmarkDropTargets();
};

const endGroupDrag = () => {
  draggingGroupId.value = "";
  clearBookmarkDropTargets();
};

const startLinkDrag = (event: DragEvent, group: LinkGroupWithLinks, link: Link) => {
  clearBookmarkDropTargets();
  draggingLink.value = {
    linkId: link.id,
    sourceGroupId: group.id
  };
  event.dataTransfer?.setData("text/plain", link.id);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const buildLinkSortInput = (groups: LinkGroupWithLinks[]) =>
  groups.map((group) => ({
    group_id: group.id,
    link_ids: group.links.map((link) => link.id)
  }));

const dropLink = async (targetGroup: LinkGroupWithLinks, targetLink?: Link, event?: DragEvent) => {
  event?.preventDefault();

  if (await saveDraggedBrowserTab(targetGroup)) {
    return;
  }

  if (!draggingLink.value) {
    clearBookmarkDropTargets();
    return;
  }

  const { linkId, sourceGroupId } = draggingLink.value;

  if (targetLink?.id === linkId) {
    draggingLink.value = null;
    clearBookmarkDropTargets();
    return;
  }

  const sourceGroup = linkGroups.value.find((group) => group.id === sourceGroupId);
  const draggedLink = sourceGroup?.links.find((link) => link.id === linkId);

  if (!draggedLink) {
    draggingLink.value = null;
    clearBookmarkDropTargets();
    return;
  }

  const nextGroups = linkGroups.value.map((group) => ({
    ...group,
    links: group.links.filter((link) => link.id !== linkId)
  }));
  const targetGroupIndex = nextGroups.findIndex((group) => group.id === targetGroup.id);

  if (targetGroupIndex < 0) {
    draggingLink.value = null;
    clearBookmarkDropTargets();
    return;
  }

  const targetLinks = nextGroups[targetGroupIndex].links;
  const targetIndex = targetLink ? targetLinks.findIndex((link) => link.id === targetLink.id) : targetLinks.length;
  const placement =
    linkDropTarget.value?.groupId === targetGroup.id &&
    linkDropTarget.value.linkId === (targetLink?.id ?? null)
      ? linkDropTarget.value.placement
      : event
        ? getDropPlacement(event)
        : "after";
  const insertIndex = targetIndex >= 0 ? targetIndex + (placement === "after" ? 1 : 0) : targetLinks.length;

  targetLinks.splice(insertIndex, 0, {
    ...draggedLink,
    group_id: targetGroup.id
  });

  await linksStore.sortLinks(buildLinkSortInput(nextGroups));
  draggingLink.value = null;
  clearBookmarkDropTargets();
};

const endLinkDrag = () => {
  draggingLink.value = null;
  clearBookmarkDropTargets();
};

const dropOnGroupContent = async (
  event: DragEvent,
  group: LinkGroupWithLinks,
  targetLink?: Link
) => {
  if (draggingGroupId.value) {
    await dropGroup(event, group);
    return;
  }

  await dropLink(group, targetLink, event);
};

const addTodo = async () => {
  try {
    await todosStore.addTodo(newTodoTitle.value);
    closeTodoDialog();
  } catch {
    // The store owns the localized error state shown in the dialog.
  }
};

const startEditingTodo = (todo: Todo) => {
  editingTodoId.value = todo.id;
  todoEditTitle.value = todo.title;
};

const cancelEditingTodo = () => {
  editingTodoId.value = "";
  todoEditTitle.value = "";
};

const saveTodoEdit = async () => {
  if (!editingTodoId.value) {
    return;
  }

  await todosStore.editTodo(editingTodoId.value, todoEditTitle.value);
  cancelEditingTodo();
};

const toggleTodoCompleted = async (todo: Todo) => {
  await todosStore.setTodoCompleted(todo.id, !todo.completed);
};

const deleteTodo = async (todo: Todo) => {
  const confirmed = await askConfirm(t("todos.deleteConfirm", { name: todo.title }));

  if (!confirmed) {
    return;
  }

  await todosStore.deleteTodo(todo.id);

  if (editingTodoId.value === todo.id) {
    cancelEditingTodo();
  }
};

const startTodoDrag = (event: DragEvent, todo: Todo) => {
  draggingTodoId.value = todo.id;
  event.dataTransfer?.setData("text/plain", todo.id);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const dropTodo = async (event: DragEvent, targetTodo: Todo) => {
  if (!draggingTodoId.value || draggingTodoId.value === targetTodo.id) {
    draggingTodoId.value = "";
    return;
  }

  const orderedTodos = moveAround(
    todos.value,
    draggingTodoId.value,
    targetTodo.id,
    (todo) => todo.id,
    getDropPlacement(event)
  );

  await todosStore.sortTodos(orderedTodos.map((todo) => todo.id));
  draggingTodoId.value = "";
};

const endTodoDrag = () => {
  draggingTodoId.value = "";
};

const getBackupSummaryParams = (
  backup: HappyTabBackupV1 | DataImportSummary
): TranslationParams => {
  if ("data" in backup) {
    return {
      groups: backup.data.link_groups.length,
      links: backup.data.links.length,
      todos: backup.data.todos.length,
      stats: backup.data.usage_stats.length
    };
  }

  return {
    groups: backup.link_groups,
    links: backup.links,
    todos: backup.todos,
    stats: backup.usage_stats
  };
};

const getBackupErrorMessageKey = (error: unknown): MessageKey => {
  if (!(error instanceof DataBackupError)) {
    return "error.importData";
  }

  const keys: Record<DataBackupError["code"], MessageKey> = {
    file_too_large: "error.backupFileTooLarge",
    invalid_json: "error.backupInvalidJson",
    invalid_format: "error.backupInvalidFormat",
    unsupported_version: "error.backupUnsupportedVersion",
    invalid_data: "error.backupInvalidData",
    unsafe_url: "error.backupUnsafeUrl"
  };

  return keys[error.code];
};

const exportLocalData = async () => {
  isDataTransferBusy.value = true;
  dataTransferNotice.value = null;

  try {
    const backup = await downloadHappyTabBackup();
    dataTransferNotice.value = {
      kind: "success",
      key: "data.exportSuccess",
      params: getBackupSummaryParams(backup)
    };
  } catch {
    dataTransferNotice.value = { kind: "error", key: "error.exportData" };
  } finally {
    isDataTransferBusy.value = false;
  }
};

const selectImportBackup = async (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const file = target.files?.[0];
  target.value = "";

  if (!file) {
    return;
  }

  isDataTransferBusy.value = true;
  dataTransferNotice.value = null;
  selectedImportBackup.value = null;
  selectedImportFileName.value = "";

  try {
    selectedImportBackup.value = await readHappyTabBackupFile(file);
    selectedImportFileName.value = file.name;
  } catch (error) {
    dataTransferNotice.value = { kind: "error", key: getBackupErrorMessageKey(error) };
  } finally {
    isDataTransferBusy.value = false;
  }
};

const importLocalData = async () => {
  if (!selectedImportBackup.value) {
    return;
  }

  if (dataImportMode.value === "replace") {
    const confirmed = await askConfirm(t("data.replaceConfirm"));

    if (!confirmed) {
      return;
    }
  }

  isDataTransferBusy.value = true;
  dataTransferNotice.value = null;

  try {
    const summary = await restoreHappyTabBackup(selectedImportBackup.value, dataImportMode.value);
    await Promise.all([linksStore.loadLinks(), todosStore.loadTodos()]);

    if (!linkGroups.value.some((group) => group.id === selectedGroupId.value)) {
      selectedGroupId.value = defaultGroupId.value;
    }

    selectedImportBackup.value = null;
    selectedImportFileName.value = "";
    dataTransferNotice.value = {
      kind: "success",
      key: "data.importSuccess",
      params: getBackupSummaryParams(summary)
    };
  } catch (error) {
    dataTransferNotice.value = { kind: "error", key: getBackupErrorMessageKey(error) };
  } finally {
    isDataTransferBusy.value = false;
  }
};

const closeDataPanel = () => {
  if (!isDataTransferBusy.value) {
    isDataPanelOpen.value = false;
  }
};

const openDataPanel = () => {
  isTodoDialogOpen.value = false;
  isThemePanelOpen.value = false;
  isAboutPanelOpen.value = false;
  isDataPanelOpen.value = true;
};

const openThemePanel = () => {
  isTodoDialogOpen.value = false;
  isDataPanelOpen.value = false;
  isAboutPanelOpen.value = false;
  themeErrorKey.value = null;
  isThemePanelOpen.value = true;
};

const closeThemePanel = () => {
  isThemePanelOpen.value = false;
};

const applyThemeMode = async (mode: ThemeMode) => {
  themeErrorKey.value = null;

  try {
    await setThemeMode(mode);
  } catch {
    themeErrorKey.value = "error.saveTheme";
  }
};

const applyThemeStyle = async (style: ThemeStyle) => {
  themeErrorKey.value = null;

  try {
    await setThemeStyle(style);
  } catch {
    themeErrorKey.value = "error.saveTheme";
  }
};

const applyThemePalette = async (palette: ThemePalette) => {
  themeErrorKey.value = null;

  try {
    await setThemePalette(palette);
  } catch {
    themeErrorKey.value = "error.saveTheme";
  }
};

const changeCustomAccent = async (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  themeErrorKey.value = null;

  try {
    await updateCustomTheme({
      ...themeSettings.value.custom,
      accent: target.value
    });
  } catch {
    themeErrorKey.value = "error.saveTheme";
  }
};

const saveThemeBackgroundSetting = async (
  background: Parameters<typeof updateThemeBackground>[0]
) => {
  themeErrorKey.value = null;

  try {
    await updateThemeBackground(background);
  } catch {
    themeErrorKey.value = "error.saveTheme";
  }
};

const applyBackgroundType = (type: ThemeBackgroundType) => {
  if (type === "custom-image" && !themeBackgroundAsset.value) {
    return;
  }

  void saveThemeBackgroundSetting({ type });
};

const applyWallpaper = (wallpaperId: WallpaperId) => {
  void saveThemeBackgroundSetting({ type: "wallpaper", wallpaperId });
};

const changeThemeBackgroundFit = (event: Event) => {
  const target = event.target;

  if (target instanceof HTMLSelectElement) {
    void saveThemeBackgroundSetting({
      fit: target.value as "cover" | "contain"
    });
  }
};

const changeThemeBackgroundNumber = (
  key: "overlay" | "blur",
  event: Event
) => {
  const target = event.target;

  if (target instanceof HTMLInputElement) {
    void saveThemeBackgroundSetting({ [key]: Number(target.value) });
  }
};

const toggleThemeEffect = (
  key: "animation" | "blur" | "glow",
  event: Event
) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  themeErrorKey.value = null;
  void updateThemeEffects({ [key]: target.checked }).catch(() => {
    themeErrorKey.value = "error.saveTheme";
  });
};

const selectThemeBackgroundImage = async (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement) || !target.files?.[0]) {
    return;
  }

  const [file] = target.files;
  target.value = "";
  themeErrorKey.value = null;
  isThemeBackgroundBusy.value = true;

  try {
    await setThemeBackgroundImage(file);
  } catch (error) {
    themeErrorKey.value =
      error instanceof ThemeBackgroundError
        ? ({
            empty_file: "error.backgroundImageEmpty",
            file_too_large: "error.backgroundImageTooLarge",
            unsupported_type: "error.backgroundImageUnsupported"
          } satisfies Record<ThemeBackgroundError["code"], MessageKey>)[error.code]
        : "error.saveBackgroundImage";
  } finally {
    isThemeBackgroundBusy.value = false;
  }
};

const deleteThemeBackgroundImage = async () => {
  themeErrorKey.value = null;
  isThemeBackgroundBusy.value = true;

  try {
    await removeThemeBackgroundImage();
  } catch {
    themeErrorKey.value = "error.saveBackgroundImage";
  } finally {
    isThemeBackgroundBusy.value = false;
  }
};

const resetThemeSettings = async () => {
  themeErrorKey.value = null;

  try {
    await resetTheme();
  } catch {
    themeErrorKey.value = "error.saveTheme";
  }
};

const changeLocale = async (nextLocale: SupportedLocale) => {
  localeErrorMessage.value = "";

  try {
    await setLocale(nextLocale);
  } catch {
    localeErrorMessage.value = t("error.saveLocale");
  }
};

watch(
  defaultGroupId,
  (groupId) => {
    if (groupId && !selectedGroupId.value) {
      selectedGroupId.value = groupId;
    }
  },
  { immediate: true }
);

onMounted(() => {
  void loadBrowserTabs();
  void linksStore.loadLinks();
  void todosStore.loadTodos();
  void syncStore.loadConfig();
  document.addEventListener("visibilitychange", refreshBrowserTabsWhenVisible);
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", refreshBrowserTabsWhenVisible);
  window.clearTimeout(savedTabFeedbackTimer);
  resolveConfirmRequest(false);
});
</script>

<template>
  <main class="newtab-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">HappyTab</p>
        <h1>{{ t("top.bookmarks") }}</h1>
      </div>
      <div class="topbar-actions">
        <LanguageMenu :model-value="locale" @change="changeLocale" />
        <button
          class="text-button sync-panel-button"
          type="button"
          :aria-expanded="isSyncPanelOpen"
          :aria-label="t('cloud.title')"
          @click="openSyncPanel"
        >
          {{ t("cloud.summary") }}
        </button>
        <button
          class="text-button theme-panel-button"
          type="button"
          :aria-expanded="isThemePanelOpen"
          :aria-label="t('theme.openButton')"
          @click="openThemePanel"
        >
          {{ t("theme.openButton") }}
        </button>
        <button
          class="text-button data-panel-button"
          type="button"
          :aria-expanded="isDataPanelOpen"
          :aria-label="t('data.openButton')"
          @click="openDataPanel"
        >
          {{ t("data.openButton") }}
        </button>
        <button class="refresh-button" type="button" @click="loadBrowserTabs">
          {{ t("top.refreshTabs") }}
        </button>
        <button
          class="text-button about-panel-button"
          type="button"
          :aria-expanded="isAboutPanelOpen"
          :aria-label="t('about.title')"
          @click="openAboutPanel"
        >
          {{ t("about.openButton") }}
        </button>
      </div>
    </header>

    <p
      v-if="savedTabMessage"
      class="save-feedback"
      role="status"
      aria-live="polite"
    >
      <svg class="save-feedback-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="m3.5 8 3 3 6-6" />
      </svg>
      <span>{{ savedTabMessage }}</span>
    </p>

    <AboutDialog
      :open="isAboutPanelOpen"
      @close="closeAboutPanel"
      @open-sync="openSyncFromAbout"
    />

    <div v-if="isTodoDialogOpen" class="modal-backdrop" @click.self="closeTodoDialog">
      <section
        class="data-dialog todo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-dialog-title"
        @keydown.esc="closeTodoDialog"
      >
        <header class="data-dialog-header">
          <div>
            <h2 id="todo-dialog-title">{{ t("todos.newTodo") }}</h2>
            <p>{{ t("todos.noTodosDescription") }}</p>
          </div>
          <button
            class="close-button"
            type="button"
            :aria-label="t('common.close')"
            @click="closeTodoDialog"
          >
            ×
          </button>
        </header>

        <div class="data-dialog-body">
          <form class="todo-create-form" @submit.prevent="addTodo">
            <label for="todo-title">{{ t("todos.todoTitle") }}</label>
            <input
              id="todo-title"
              ref="todoTitleInput"
              v-model="newTodoTitle"
              type="text"
              :placeholder="t('todos.placeholder')"
              required
            />
            <p v-if="todosErrorMessage" class="error-text">
              {{ t(todosErrorMessage) }}
            </p>
            <div class="todo-dialog-actions">
              <button class="primary-button" type="submit">{{ t("common.add") }}</button>
              <button class="secondary-button" type="button" @click="closeTodoDialog">
                {{ t("common.cancel") }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>

    <div v-if="isSyncPanelOpen" class="modal-backdrop" @click.self="closeSyncPanel">
      <section
        class="data-dialog sync-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-dialog-title"
        @keydown.esc="closeSyncPanel"
      >
        <header class="data-dialog-header">
          <div>
            <h2 id="sync-dialog-title">{{ t("cloud.title") }}</h2>
            <p>{{ t("cloud.description") }}</p>
          </div>
          <button
            class="close-button"
            type="button"
            :aria-label="t('common.close')"
            @click="closeSyncPanel"
          >
            ×
          </button>
        </header>

        <div class="data-dialog-body">
        <form class="sync-config-form" @submit.prevent="saveSyncSettings">
          <div class="form-row">
            <label for="sync-provider">{{ t("cloud.provider") }}</label>
            <div class="select-control">
              <select
                id="sync-provider"
                v-model="syncForm.provider"
                @change="onProviderChange"
              >
                <option value="jsonbin">JSONBin.io</option>
                <option value="gist">GitHub Gist</option>
                <option value="cloudflare_kv">Cloudflare KV</option>
                <option value="upstash_redis">Upstash Redis</option>
                <option value="custom_rest">Custom REST API</option>
              </select>
            </div>
          </div>

          <aside class="provider-resources" aria-live="polite">
            <template v-if="syncForm.provider !== 'custom_rest'">
              <p>{{ t("cloud.providerResourcesTip") }}</p>
              <div class="provider-resource-links">
                <a
                  :href="activeSyncProviderResources.officialUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ t("cloud.officialWebsite") }} <span aria-hidden="true">↗</span>
                </a>
                <a
                  :href="activeSyncProviderResources.documentationUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ t("cloud.integrationDocs") }} <span aria-hidden="true">↗</span>
                </a>
              </div>
            </template>
            <p v-else class="custom-rest-resource-tip">{{ t("cloud.customRestResourcesTip") }}</p>
          </aside>

          <JsonBinSetupGuide
            v-if="syncForm.provider === 'jsonbin'"
            :configured="isJsonBinConfigured(syncForm.jsonbin.apiKey, syncForm.jsonbin.binId)"
          />
          <GistSetupGuide
            v-if="syncForm.provider === 'gist'"
            :configured="isGistConfigured(syncForm.gist.token, syncForm.gist.gistId)"
          />
          <UpstashSetupGuide
            v-if="syncForm.provider === 'upstash_redis'"
            :configured="isUpstashConfigured(syncForm.upstashRedis.url, syncForm.upstashRedis.token)"
          />
          <CloudflareSetupGuide
            v-if="syncForm.provider === 'cloudflare_kv'"
            :configured="
              isCloudflareKvConfigured(
                syncForm.cloudflareKv.accountId,
                syncForm.cloudflareKv.namespaceId,
                syncForm.cloudflareKv.apiToken
              )
            "
          />

          <div class="form-row checkbox-row">
            <label class="checkbox-label" :class="{ selected: syncForm.enabled }">
              <input v-model="syncForm.enabled" type="checkbox" />
              <span>{{ t("cloud.enableSync") }}</span>
            </label>
            <label class="checkbox-label" :class="{ selected: syncForm.autoSync }">
              <input v-model="syncForm.autoSync" type="checkbox" />
              <span>{{ t("cloud.autoSync") }}</span>
            </label>
          </div>

          <div v-if="syncForm.provider === 'jsonbin'" class="provider-fields">
            <div class="form-row">
              <label for="jsonbin-key">{{ t("cloud.jsonbinApiKey") }}</label>
              <input id="jsonbin-key" v-model="syncForm.jsonbin.apiKey" type="password" />
              <small class="help-text">{{ t("cloud.jsonbinApiKeyTip") }}</small>
            </div>
            <div class="form-row">
              <label for="jsonbin-id">{{ t("cloud.jsonbinBinId") }}</label>
              <input id="jsonbin-id" v-model="syncForm.jsonbin.binId" type="text" />
            </div>
          </div>

          <div v-if="syncForm.provider === 'gist'" class="provider-fields">
            <div class="form-row">
              <label for="gist-token">{{ t("cloud.gistToken") }}</label>
              <input id="gist-token" v-model="syncForm.gist.token" type="password" />
              <small class="help-text">{{ t("cloud.gistTokenTip") }}</small>
            </div>
            <div class="form-row">
              <label for="gist-id">{{ t("cloud.gistId") }}</label>
              <input id="gist-id" v-model="syncForm.gist.gistId" type="text" />
            </div>
            <div class="form-row">
              <label for="gist-filename">{{ t("cloud.gistFilename") }}</label>
              <input id="gist-filename" v-model="syncForm.gist.filename" type="text" />
            </div>
          </div>

          <div v-if="syncForm.provider === 'cloudflare_kv'" class="provider-fields">
            <div class="form-row">
              <label for="cf-account">{{ t("cloud.cfAccountId") }}</label>
              <input id="cf-account" v-model="syncForm.cloudflareKv.accountId" type="text" />
              <small class="help-text">{{ t("cloud.cfAccountIdTip") }}</small>
            </div>
            <div class="form-row">
              <label for="cf-namespace">{{ t("cloud.cfNamespaceId") }}</label>
              <input id="cf-namespace" v-model="syncForm.cloudflareKv.namespaceId" type="text" />
              <small class="help-text">{{ t("cloud.cfNamespaceIdTip") }}</small>
            </div>
            <div class="form-row">
              <label for="cf-token">{{ t("cloud.cfApiToken") }}</label>
              <input id="cf-token" v-model="syncForm.cloudflareKv.apiToken" type="password" />
              <small class="help-text">{{ t("cloud.cfApiTokenTip") }}</small>
            </div>
            <div class="form-row">
              <label for="cf-key">{{ t("cloud.cfKeyName") }}</label>
              <input id="cf-key" v-model="syncForm.cloudflareKv.keyName" type="text" />
            </div>
          </div>

          <div v-if="syncForm.provider === 'upstash_redis'" class="provider-fields">
            <div class="form-row">
              <label for="upstash-url">{{ t("cloud.upstashUrl") }}</label>
              <input id="upstash-url" v-model="syncForm.upstashRedis.url" type="url" />
              <small class="help-text">{{ t("cloud.upstashUrlTip") }}</small>
            </div>
            <div class="form-row">
              <label for="upstash-token">{{ t("cloud.upstashToken") }}</label>
              <input id="upstash-token" v-model="syncForm.upstashRedis.token" type="password" />
              <small class="help-text">{{ t("cloud.upstashTokenTip") }}</small>
            </div>
            <div class="form-row">
              <label for="upstash-key">{{ t("cloud.upstashKeyName") }}</label>
              <input id="upstash-key" v-model="syncForm.upstashRedis.keyName" type="text" />
            </div>
          </div>

          <div v-if="syncForm.provider === 'custom_rest'" class="provider-fields">
            <div class="form-row">
              <label for="custom-endpoint">{{ t("cloud.customEndpoint") }}</label>
              <input id="custom-endpoint" v-model="syncForm.customRest.endpointUrl" type="url" />
            </div>
            <div class="form-row">
              <label for="custom-headers">{{ t("cloud.customHeaders") }}</label>
              <textarea id="custom-headers" v-model="syncForm.customRest.headersJson" rows="2"></textarea>
            </div>
          </div>

          <div class="form-row encryption-row">
            <label for="encryption-key">{{ t("cloud.encryptionKey") }}</label>
            <input id="encryption-key" v-model="syncForm.encryptionKey" type="password" />
            <small class="help-text">{{ t("cloud.encryptionKeyTip") }}</small>
          </div>

          <div class="sync-actions-row">
            <button class="primary-button" type="submit">
              {{ t("common.save") }}
            </button>
            <button class="secondary-button" type="button" :disabled="isTesting" @click="testSyncConnection">
              {{ isTesting ? t("cloud.testing") : t("cloud.testConnection") }}
            </button>
            <button class="secondary-button" type="button" :disabled="isSyncing || !syncForm.enabled" @click="triggerManualSync">
              {{ isSyncing ? t("cloud.syncing") : t("cloud.syncNow") }}
            </button>
          </div>
        </form>

        <div class="sync-status-info">
          <p v-if="syncConfig.lastSyncTime">
            {{ t("cloud.lastSyncTime", { time: formatDateTime(syncConfig.lastSyncTime) }) }}
          </p>
          <p v-else>{{ t("cloud.neverSynced") }}</p>
          <p v-if="syncTestStatus" :class="syncTestStatus.success ? 'success-text' : 'error-text'">
            {{ t(syncTestStatus.message) }}
          </p>
          <p v-if="syncLastResult" :class="syncLastResult.success ? 'success-text' : 'error-text'">
            {{ t(syncLastResult.message ?? (syncLastResult.success ? "cloud.syncSuccess" : "cloud.syncFailed")) }}
          </p>
        </div>
        </div>
      </section>
    </div>

    <div v-if="isThemePanelOpen" class="modal-backdrop" @click.self="closeThemePanel">
      <section
        class="data-dialog theme-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-dialog-title"
        @keydown.esc="closeThemePanel"
      >
        <header class="data-dialog-header">
          <div>
            <h2 id="theme-dialog-title">{{ t("theme.title") }}</h2>
            <p>{{ t("theme.description") }}</p>
          </div>
          <button
            class="close-button"
            type="button"
            :aria-label="t('common.close')"
            @click="closeThemePanel"
          >
            ×
          </button>
        </header>

        <div class="data-dialog-body theme-dialog-scroll-area">
          <header class="theme-setting-header theme-gallery-heading">
            <h3>{{ t("theme.gallery") }}</h3>
            <p>{{ t("theme.galleryDescription") }}</p>
          </header>
          <div class="theme-style-grid">
            <button
              v-for="option in themeStyleOptions"
              :key="option.style"
              type="button"
              class="theme-style-card"
              :class="{ selected: themeSettings.style === option.style }"
              :aria-pressed="themeSettings.style === option.style"
              @click="applyThemeStyle(option.style)"
            >
              <span
                class="theme-mini-preview"
                :class="`theme-mini-preview-${option.style}`"
                aria-hidden="true"
              >
                <i></i>
                <span><b></b><b></b><b></b><b></b></span>
              </span>
              <span class="theme-option-copy">
                <strong>{{ t(option.label) }}</strong>
                <small>{{ t(option.description) }}</small>
              </span>
            </button>
          </div>

          <header class="theme-setting-header">
            <h3>{{ t("theme.colorMode") }}</h3>
            <p>{{ t("theme.colorModeDescription") }}</p>
          </header>
          <div class="theme-mode-list">
            <button
              v-for="option in themeModeOptions"
              :key="option.mode"
              type="button"
              :class="{ selected: themeSettings.mode === option.mode }"
              :aria-pressed="themeSettings.mode === option.mode"
              @click="applyThemeMode(option.mode)"
            >
              <span
                class="theme-preview"
                :class="`theme-preview-${option.mode}`"
                aria-hidden="true"
              >
                <span></span>
                <i></i>
              </span>
              <span class="theme-option-copy">
                <strong>{{ t(option.label) }}</strong>
                <small>{{ t(option.description) }}</small>
              </span>
            </button>
          </div>

          <header class="theme-setting-header">
            <h3>{{ t("theme.palette") }}</h3>
            <p>{{ t("theme.paletteDescription") }}</p>
          </header>
          <div class="theme-palette-list">
            <button
              v-for="option in themePaletteOptions"
              :key="option.palette"
              type="button"
              :class="{ selected: themeSettings.palette === option.palette }"
              :aria-pressed="themeSettings.palette === option.palette"
              @click="applyThemePalette(option.palette)"
            >
              <i class="theme-palette-swatch" :style="{ background: option.color }"></i>
              {{ t(option.label) }}
            </button>
          </div>
          <label v-if="themeSettings.palette === 'custom'" class="theme-custom-fields">
            <span>{{ t("theme.accent") }}</span>
            <span class="color-input-row">
              <input
                type="color"
                :value="themeSettings.custom.accent"
                @change="changeCustomAccent"
              />
              <code>{{ themeSettings.custom.accent }}</code>
            </span>
          </label>

          <header class="theme-setting-header">
            <h3>{{ t("theme.backgroundType") }}</h3>
            <p>{{ t("theme.backgroundTypeDescription") }}</p>
          </header>
          <div class="theme-background-type-list">
            <button
              v-for="option in themeBackgroundTypeOptions"
              :key="option.type"
              type="button"
              :class="{ selected: themeSettings.background.type === option.type }"
              :aria-pressed="themeSettings.background.type === option.type"
              :disabled="option.type === 'custom-image' && !themeBackgroundAsset"
              @click="applyBackgroundType(option.type)"
            >
              {{ t(option.label) }}
            </button>
          </div>

          <div
            v-if="themeSettings.background.type === 'wallpaper'"
            class="theme-wallpaper-grid"
          >
            <button
              v-for="option in themeWallpaperOptions"
              :key="option.id"
              type="button"
              class="theme-wallpaper-card"
              :class="{ selected: themeSettings.background.wallpaperId === option.id }"
              :aria-pressed="themeSettings.background.wallpaperId === option.id"
              @click="applyWallpaper(option.id)"
            >
              <img :src="option.backgroundUrl" alt="" />
              <strong>{{ t(option.label) }}</strong>
            </button>
          </div>

          <section class="theme-background-settings" aria-labelledby="theme-background-title">
            <header>
              <div>
                <h3 id="theme-background-title">{{ t("theme.backgroundImage") }}</h3>
                <p>{{ t("theme.backgroundImageDescription") }}</p>
              </div>
              <label class="file-picker theme-background-picker">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  :disabled="isThemeBackgroundBusy"
                  @change="selectThemeBackgroundImage"
                />
                {{
                  t(
                    themeBackgroundAsset
                      ? "theme.replaceBackgroundImage"
                      : "theme.chooseBackgroundImage"
                  )
                }}
              </label>
            </header>

            <p class="theme-background-help">{{ t("theme.backgroundImageHelp") }}</p>

            <div v-if="themeBackgroundAsset" class="theme-background-file">
              <span>
                {{
                  t("theme.backgroundImageSelected", {
                    name: themeBackgroundAsset.file_name,
                    size: `${(themeBackgroundAsset.size / 1024 / 1024).toFixed(1)} MB`
                  })
                }}
              </span>
              <button
                class="danger-button"
                type="button"
                :disabled="isThemeBackgroundBusy"
                @click="deleteThemeBackgroundImage"
              >
                {{ t("theme.removeBackgroundImage") }}
              </button>
            </div>

            <div
              v-if="themeSettings.background.type === 'custom-image'"
              class="theme-background-controls"
              :class="{ disabled: !themeBackgroundAsset }"
            >
              <label>
                <span>{{ t("theme.backgroundFit") }}</span>
                <select
                  :value="themeSettings.background.fit"
                  :disabled="!themeBackgroundAsset || isThemeBackgroundBusy"
                  @change="changeThemeBackgroundFit"
                >
                  <option value="cover">{{ t("theme.backgroundCover") }}</option>
                  <option value="contain">{{ t("theme.backgroundContain") }}</option>
                </select>
              </label>

              <label>
                <span>
                  {{ t("theme.backgroundOverlay") }}
                  <output>{{ themeSettings.background.overlay }}%</output>
                </span>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  :value="themeSettings.background.overlay"
                  :disabled="!themeBackgroundAsset || isThemeBackgroundBusy"
                  @change="changeThemeBackgroundNumber('overlay', $event)"
                />
              </label>

              <label>
                <span>
                  {{ t("theme.backgroundBlur") }}
                  <output>{{ themeSettings.background.blur }}px</output>
                </span>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  :value="themeSettings.background.blur"
                  :disabled="!themeBackgroundAsset || isThemeBackgroundBusy"
                  @change="changeThemeBackgroundNumber('blur', $event)"
                />
              </label>
            </div>
          </section>

          <header class="theme-setting-header">
            <h3>{{ t("theme.effects") }}</h3>
            <p>{{ t("theme.effectsDescription") }}</p>
          </header>
          <div class="theme-effect-list">
            <label :class="{ selected: themeSettings.effects.blur }">
              <input
                type="checkbox"
                :checked="themeSettings.effects.blur"
                @change="toggleThemeEffect('blur', $event)"
              />
              {{ t("theme.effectBlur") }}
            </label>
            <label :class="{ selected: themeSettings.effects.animation }">
              <input
                type="checkbox"
                :checked="themeSettings.effects.animation"
                @change="toggleThemeEffect('animation', $event)"
              />
              {{ t("theme.effectAnimation") }}
            </label>
            <label :class="{ selected: themeSettings.effects.glow }">
              <input
                type="checkbox"
                :checked="themeSettings.effects.glow"
                @change="toggleThemeEffect('glow', $event)"
              />
              {{ t("theme.effectGlow") }}
            </label>
          </div>

          <p class="theme-accessibility-note">{{ t("theme.accessibilityNote") }}</p>
          <p v-if="themeErrorKey" class="error-text" aria-live="polite">
            {{ t(themeErrorKey) }}
          </p>

          <footer class="theme-dialog-actions">
            <button class="secondary-form-button" type="button" @click="resetThemeSettings">
              {{ t("theme.reset") }}
            </button>
          </footer>
        </div>
      </section>
    </div>

    <div v-if="isDataPanelOpen" class="modal-backdrop" @click.self="closeDataPanel">
      <section
        class="data-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-dialog-title"
        @keydown.esc="closeDataPanel"
      >
        <header class="data-dialog-header">
          <div>
            <h2 id="data-dialog-title">{{ t("data.title") }}</h2>
            <p>{{ t("data.description") }}</p>
          </div>
          <button
            class="close-button"
            type="button"
            :disabled="isDataTransferBusy"
            :aria-label="t('common.close')"
            @click="closeDataPanel"
          >
            ×
          </button>
        </header>

        <div class="data-dialog-body">
        <section class="data-dialog-section">
          <div>
            <h3>{{ t("data.exportTitle") }}</h3>
            <p>{{ t("data.exportDescription") }}</p>
          </div>
          <button type="button" :disabled="isDataTransferBusy" @click="exportLocalData">
            {{ t("data.exportButton") }}
          </button>
        </section>

        <section class="data-dialog-section import-section">
          <div>
            <h3>{{ t("data.importTitle") }}</h3>
            <p>{{ t("data.importDescription") }}</p>
          </div>

          <label class="file-picker" :class="{ disabled: isDataTransferBusy }">
            <input
              type="file"
              accept=".json,application/json"
              :disabled="isDataTransferBusy"
              @change="selectImportBackup"
            />
            <span>{{ t("data.chooseFile") }}</span>
          </label>

          <div v-if="selectedImportBackup" class="selected-backup">
            <strong>{{ t("data.selectedFile", { name: selectedImportFileName }) }}</strong>
            <span>{{ t("data.fileSummary", getBackupSummaryParams(selectedImportBackup)) }}</span>
          </div>

          <fieldset class="import-mode-list">
            <legend class="visually-hidden">{{ t("data.importTitle") }}</legend>
            <label :class="{ selected: dataImportMode === 'merge' }">
              <input v-model="dataImportMode" type="radio" value="merge" />
              <span>
                <strong>{{ t("data.mergeMode") }}</strong>
                <small>{{ t("data.mergeDescription") }}</small>
              </span>
            </label>
            <label :class="{ selected: dataImportMode === 'replace' }">
              <input v-model="dataImportMode" type="radio" value="replace" />
              <span>
                <strong>{{ t("data.replaceMode") }}</strong>
                <small>{{ t("data.replaceDescription") }}</small>
              </span>
            </label>
          </fieldset>

          <button
            class="import-data-button"
            type="button"
            :disabled="isDataTransferBusy || !selectedImportBackup"
            @click="importLocalData"
          >
            {{ t("data.importButton") }}
          </button>
        </section>

        <p
          v-if="dataTransferNotice"
          class="data-transfer-notice"
          :class="dataTransferNotice.kind"
          aria-live="polite"
        >
          {{ dataTransferNoticeMessage }}
        </p>
        <p class="data-exclusions">{{ t("data.excluded") }}</p>
        </div>
      </section>
    </div>

    <section class="status-row" aria-live="polite">
      <span v-if="isTabsLoading || isLinksLoading || isTodosLoading">{{ t("status.loadingWorkspace") }}</span>
      <span v-if="tabsErrorMessage" class="error-text">{{ t(tabsErrorMessage) }}</span>
      <span v-if="linksErrorMessage" class="error-text">{{ t(linksErrorMessage) }}</span>
      <span v-if="todosErrorMessage" class="error-text">{{ t(todosErrorMessage) }}</span>
      <span v-if="localeErrorMessage" class="error-text">{{ localeErrorMessage }}</span>
    </section>

    <section class="workspace-grid">
      <section class="workspace-column">
        <header class="section-header">
          <div>
            <h2>{{ t("tabs.title") }}</h2>
            <p>{{ t("tabs.summary", { count: tabCount }) }}</p>
          </div>
        </header>

        <label class="tab-search" for="tab-search">
          <svg class="tab-search-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.6" />
            <path d="M10.4 10.4 14 14" />
          </svg>
          <input
            id="tab-search"
            v-model="tabSearchQuery"
            type="search"
            :placeholder="t('tabs.search')"
          />
        </label>

        <section v-if="!isTabsLoading && windowGroups.length === 0" class="empty-state">
          <h3>{{ t("tabs.noTabsTitle") }}</h3>
          <p>{{ t("tabs.noTabsDescription") }}</p>
        </section>

        <section v-else-if="filteredWindowGroups.length > 0" class="windows-grid">
          <article v-for="windowGroup in filteredWindowGroups" :key="windowGroup.id" class="window-panel">
            <header class="window-header">
              <div class="window-heading">
                <h3>{{ t("tabs.window", { id: windowDisplayNumber(windowGroup.id) }) }}</h3>
                <p>{{ t("tabs.count", { count: windowGroup.tabs.length }) }}</p>
              </div>
              <span v-if="windowGroup.focused" class="focused-badge">{{ t("tabs.focused") }}</span>
            </header>

            <ul class="tab-list">
              <li
                v-for="tab in windowGroup.tabs"
                :key="tab.id"
                class="tab-row"
                :class="{ active: tab.active, dragging: draggingBrowserTab?.id === tab.id }"
                :draggable="Boolean(tab.url)"
                @dragstart="startBrowserTabDrag($event, tab)"
                @dragend="endBrowserTabDrag"
                @mouseenter="updateOverflowTitlePan"
                @mouseleave="resetOverflowTitlePan"
                @focusin="updateOverflowTitlePan"
                @focusout="resetOverflowTitlePan"
              >
                <button
                  class="tab-open-button"
                  type="button"
                  :title="tab.title"
                  @click="selectTab(tab)"
                >
                  <FaviconImage
                    img-class="favicon"
                    :page-url="tab.url"
                    :stored-url="tab.favIconUrl"
                  />

                  <span class="tab-copy">
                    <span class="tab-title" data-title-viewport>
                      <span class="title-pan-text" data-title-text>
                        <span v-if="tab.pinned" class="pin-marker" :aria-label="t('tabs.pinned')">
                          {{ t("tabs.pinned") }}
                        </span>
                        {{ tab.title }}
                      </span>
                    </span>
                    <span class="tab-url">{{ tab.url }}</span>
                  </span>
                </button>

                <div class="row-actions">
                  <button
                    class="tab-action-button tab-save-button"
                    type="button"
                    :title="t('tabs.saveTo', { group: activeGroupName })"
                    :aria-label="t('tabs.saveAria', { title: tab.title, group: activeGroupName })"
                    :disabled="!tab.url"
                    @click="saveTabAsLink(tab)"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20">
                      <path d="M10 4v12M4 10h12" />
                    </svg>
                  </button>
                  <button
                    class="tab-action-button tab-close-button"
                    type="button"
                    :title="t('tabs.closeAria', { title: tab.title })"
                    :aria-label="t('tabs.closeAria', { title: tab.title })"
                    @click="removeTab(tab)"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20">
                      <path d="m5 5 10 10M15 5 5 15" />
                    </svg>
                  </button>
                </div>
              </li>
            </ul>
          </article>
        </section>
        <section v-else class="empty-state compact-empty">
          <h3>{{ t("tabs.noMatchTitle") }}</h3>
          <p>{{ t("tabs.noMatchDescription") }}</p>
        </section>
      </section>

      <aside class="workspace-column saved-links-column">
        <header class="section-header">
          <div>
            <h2>{{ t("top.bookmarks") }}</h2>
            <p>{{ t("bookmarks.summary", { count: linkCount }) }}</p>
          </div>
        </header>

        <details class="bookmark-create-panel">
          <summary>
            <span class="bookmark-panel-label bookmark-panel-label-closed">
              {{ t("bookmarks.addPanel") }}
            </span>
            <span class="bookmark-panel-label bookmark-panel-label-open">
              {{ t("bookmarks.collapseAddPanel") }}
            </span>
            <svg class="bookmark-panel-chevron" aria-hidden="true" viewBox="0 0 20 20">
              <path d="m5 8 5 5 5-5" />
            </svg>
          </summary>
          <div class="bookmark-create-content">
            <form class="inline-form" @submit.prevent="addLinkGroup">
              <label for="group-name">{{ t("bookmarks.newGroup") }}</label>
              <div class="form-row">
                <input
                  id="group-name"
                  v-model="newGroupName"
                  type="text"
                  :placeholder="t('bookmarks.groupPlaceholder')"
                />
                <button type="submit">{{ t("common.add") }}</button>
              </div>
            </form>

            <form class="stacked-form" @submit.prevent="addCustomLink">
              <label for="target-group">{{ t("bookmarks.targetGroup") }}</label>
              <select id="target-group" v-model="selectedGroupId">
                <option v-for="group in linkGroups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>

              <label for="link-title">{{ t("bookmarks.linkTitle") }}</label>
              <input
                id="link-title"
                v-model="linkForm.title"
                type="text"
                :placeholder="t('bookmarks.linkTitlePlaceholder')"
              />

              <label for="link-url">{{ t("bookmarks.linkUrl") }}</label>
              <input id="link-url" v-model="linkForm.url" type="url" placeholder="https://example.com" />

              <button type="submit">{{ t("bookmarks.addLink") }}</button>
            </form>
          </div>
        </details>

        <section
          class="link-groups"
          :class="{
            'is-dragging-group': Boolean(draggingGroupId),
            'is-dragging-link': Boolean(draggingLink),
            'is-dragging-browser-tab': Boolean(draggingBrowserTab)
          }"
        >
          <article class="link-group todo-group">
            <header class="link-group-header">
              <div class="link-group-heading">
                <h3>{{ t("todos.title") }}</h3>
                <span>{{ t("todos.summary", { open: activeTodoCount, done: completedTodoCount }) }}</span>
              </div>
              <div class="row-actions">
                <button class="text-button" type="button" @click="openTodoDialog">
                  {{ t("todos.newTodo") }}
                </button>
              </div>
            </header>

            <p v-if="!isTodosLoading && todos.length === 0" class="muted-text todo-empty-state">
              {{ t("todos.noTodosTitle") }}
            </p>

            <ul v-else class="saved-link-list todo-list">
              <li
                v-for="todo in todos"
                :key="todo.id"
                class="saved-link-row todo-row"
                :class="{ completed: todo.completed, dragging: draggingTodoId === todo.id }"
                :draggable="editingTodoId !== todo.id"
                @dragstart.stop="startTodoDrag($event, todo)"
                @dragend="endTodoDrag"
                @dragover.prevent
                @drop.stop="dropTodo($event, todo)"
              >
                <form v-if="editingTodoId === todo.id" class="edit-form" @submit.prevent="saveTodoEdit">
                  <label :for="`edit-todo-${todo.id}`">{{ t("todos.todoTitle") }}</label>
                  <div class="form-row">
                    <input :id="`edit-todo-${todo.id}`" v-model="todoEditTitle" type="text" />
                    <button type="submit">{{ t("common.save") }}</button>
                    <button class="secondary-form-button" type="button" @click="cancelEditingTodo">
                      {{ t("common.cancel") }}
                    </button>
                  </div>
                </form>

                <div v-else class="todo-content">
                  <button
                    class="todo-check"
                    type="button"
                    :aria-label="todo.completed ? t('common.done') : t('todos.pending')"
                    :aria-pressed="todo.completed"
                    :title="todo.completed ? t('common.done') : t('todos.pending')"
                    @click="toggleTodoCompleted(todo)"
                  >
                    {{ todo.completed ? "✓" : "" }}
                  </button>

                  <div class="todo-copy">
                    <span class="todo-title" :title="todo.title">{{ todo.title }}</span>
                    <span class="todo-meta">
                      {{ t("todos.created", { date: formatDateTime(todo.created_at) }) }}
                      <template v-if="todo.completed_at">
                        · {{ t("todos.completed", { date: formatDateTime(todo.completed_at) }) }}
                      </template>
                    </span>
                  </div>

                  <div class="row-actions todo-actions">
                    <button class="drag-handle" type="button" :title="t('todos.dragTodo')">
                      {{ t("common.drag") }}
                    </button>
                    <button class="text-button" type="button" @click="startEditingTodo(todo)">
                      {{ t("common.edit") }}
                    </button>
                    <button class="danger-button" type="button" @click="deleteTodo(todo)">
                      {{ t("common.delete") }}
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </article>

          <article
            v-for="group in linkGroups"
            :key="group.id"
            class="link-group"
            :class="{
              dragging: draggingGroupId === group.id,
              editing: editingGroupId === group.id,
              selected: activeGroupId === group.id,
              'browser-tab-drop-target': browserTabDropGroupId === group.id,
              'link-drop-target': linkDropTarget?.groupId === group.id,
              'group-drop-before':
                groupDropTarget?.groupId === group.id && groupDropTarget.placement === 'before',
              'group-drop-after':
                groupDropTarget?.groupId === group.id && groupDropTarget.placement === 'after'
            }"
            @click="selectedGroupId = group.id"
            @dragover="handleGroupDragOver($event, group)"
            @drop="dropGroup($event, group)"
          >
            <header class="link-group-header">
              <div class="link-group-heading">
                <h3>{{ group.name }}</h3>
                <span>{{ t("bookmarks.linkCount", { count: group.links.length }) }}</span>
              </div>
              <div class="row-actions">
                <button
                  class="drag-handle"
                  type="button"
                  draggable="true"
                  :title="t('bookmarks.dragGroup')"
                  :aria-label="t('bookmarks.dragGroup')"
                  @dragstart.stop="startGroupDrag($event, group)"
                  @dragend="endGroupDrag"
                >
                  {{ t("common.drag") }}
                </button>
                <button
                  class="text-button edit-toggle-button"
                  type="button"
                  :class="{ active: editingGroupId === group.id }"
                  :aria-expanded="editingGroupId === group.id"
                  :title="t(editingGroupId === group.id ? 'common.collapse' : 'common.edit')"
                  @click="toggleEditingGroup(group)"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path
                      v-if="editingGroupId === group.id"
                      d="m5 12 5-5 5 5"
                    />
                    <path v-else d="M4 14.5V16h1.5L14.8 6.7l-1.5-1.5L4 14.5ZM12.6 5.9l1.5 1.5" />
                  </svg>
                  {{ t(editingGroupId === group.id ? "common.collapse" : "common.edit") }}
                </button>
                <button class="danger-button" type="button" @click="deleteGroup(group)">
                  {{ t("common.delete") }}
                </button>
              </div>
            </header>

            <form v-if="editingGroupId === group.id" class="edit-form" @submit.prevent="saveGroupEdit">
              <label :for="`edit-group-${group.id}`">{{ t("bookmarks.groupName") }}</label>
              <div class="form-row">
                <input :id="`edit-group-${group.id}`" v-model="groupEditName" type="text" />
                <button type="submit">{{ t("common.save") }}</button>
                <button class="secondary-form-button" type="button" @click="cancelEditingGroup">
                  {{ t("common.cancel") }}
                </button>
              </div>
            </form>

            <ul
              v-if="group.links.length > 0"
              class="saved-link-list"
              @dragover="handleLinkListDragOver($event, group)"
              @drop.stop="dropOnGroupContent($event, group)"
            >
              <li
                v-for="link in group.links"
                :key="link.id"
                class="saved-link-row"
                :class="{
                  dragging: draggingLink?.linkId === link.id,
                  editing: editingLinkId === link.id,
                  'drop-before':
                    linkDropTarget?.groupId === group.id &&
                    linkDropTarget.linkId === link.id &&
                    linkDropTarget.placement === 'before',
                  'drop-after':
                    linkDropTarget?.groupId === group.id &&
                    linkDropTarget.linkId === link.id &&
                    linkDropTarget.placement === 'after'
                }"
                :draggable="editingLinkId !== link.id"
                @dragstart.stop="startLinkDrag($event, group, link)"
                @dragend="endLinkDrag"
                @dragover="handleLinkDragOver($event, group, link)"
                @drop.stop="dropOnGroupContent($event, group, link)"
                @mouseenter="updateOverflowTitlePan"
                @mouseleave="resetOverflowTitlePan"
                @focusin="updateOverflowTitlePan"
                @focusout="resetOverflowTitlePan"
              >
                <div v-if="editingLinkId === link.id" class="link-edit-panel">
                  <form class="edit-form" @submit.prevent="saveLinkEdit">
                    <label :for="`edit-link-group-${link.id}`">{{ t("common.group") }}</label>
                    <select :id="`edit-link-group-${link.id}`" v-model="linkEditForm.group_id">
                      <option v-for="targetGroup in linkGroups" :key="targetGroup.id" :value="targetGroup.id">
                        {{ targetGroup.name }}
                      </option>
                    </select>

                    <label :for="`edit-link-title-${link.id}`">{{ t("common.title") }}</label>
                    <input :id="`edit-link-title-${link.id}`" v-model="linkEditForm.title" type="text" />

                    <label :for="`edit-link-url-${link.id}`">{{ t("common.url") }}</label>
                    <input :id="`edit-link-url-${link.id}`" v-model="linkEditForm.url" type="url" />

                    <div class="form-actions">
                      <button type="submit">{{ t("common.save") }}</button>
                      <button class="secondary-form-button" type="button" @click="cancelEditingLink">
                        {{ t("common.cancel") }}
                      </button>
                    </div>
                  </form>
                </div>

                <div v-else class="saved-link-content">
                  <button
                    class="saved-link-button"
                    type="button"
                    :title="link.title"
                    @click="openSavedLink(link)"
                  >
                    <FaviconImage
                      img-class="favicon saved-link-favicon"
                      :page-url="link.url"
                      :stored-url="link.favicon_url"
                    />
                    <span class="saved-link-copy">
                      <span class="saved-link-title" data-title-viewport>
                        <span class="title-pan-text" data-title-text>{{ link.title }}</span>
                      </span>
                      <span class="saved-link-url">{{ link.url }}</span>
                      <span class="saved-link-meta">
                        {{ t("bookmarks.openedCount", { count: link.open_count }) }}
                        <template v-if="link.last_opened_at">
                          ·
                          {{
                            t("bookmarks.lastOpened", {
                              date: formatDateTime(link.last_opened_at)
                            })
                          }}
                        </template>
                      </span>
                    </span>
                  </button>

                </div>

                <div class="row-actions saved-link-actions">
                  <button
                    class="text-button edit-toggle-button"
                    type="button"
                    :class="{ active: editingLinkId === link.id }"
                    :aria-expanded="editingLinkId === link.id"
                    :title="t(editingLinkId === link.id ? 'common.collapse' : 'common.edit')"
                    @click="toggleEditingLink(link)"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20">
                      <path v-if="editingLinkId === link.id" d="m5 12 5-5 5 5" />
                      <path v-else d="M4 14.5V16h1.5L14.8 6.7l-1.5-1.5L4 14.5ZM12.6 5.9l1.5 1.5" />
                    </svg>
                    {{ t(editingLinkId === link.id ? "common.collapse" : "common.edit") }}
                  </button>
                  <button
                    v-if="editingLinkId !== link.id"
                    class="danger-button"
                    type="button"
                    @click="deleteLink(link)"
                  >
                    {{ t("common.delete") }}
                  </button>
                </div>
              </li>
            </ul>

            <p
              v-else
              class="muted-text group-drop-hint"
              :class="{ active: linkDropTarget?.groupId === group.id }"
              @dragover="handleLinkListDragOver($event, group)"
              @drop.stop="dropOnGroupContent($event, group)"
            >
              {{ t("bookmarks.dropHint") }}
            </p>
          </article>
        </section>

        <div
          v-if="draggingGroupId || draggingLink || draggingBrowserTab"
          class="bookmark-drag-status"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">{{ draggingBrowserTab ? "+" : "↕" }}</span>
          {{
            t(
              draggingBrowserTab
                ? "bookmarks.draggingTabHint"
                : draggingLink
                  ? "bookmarks.draggingLinkHint"
                  : "bookmarks.draggingGroupHint"
            )
          }}
        </div>
      </aside>

    </section>

    <ConfirmDialog
      :open="Boolean(confirmRequest)"
      :title="confirmRequest?.title ?? ''"
      :message="confirmRequest?.message ?? ''"
      :confirm-label="confirmRequest?.confirmLabel ?? ''"
      :cancel-label="t('common.cancel')"
      @confirm="resolveConfirmRequest(true)"
      @cancel="resolveConfirmRequest(false)"
    />
  </main>
</template>
