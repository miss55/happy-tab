<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import FaviconImage from "@/components/FaviconImage.vue";
import RowActionIcon from "@/components/RowActionIcon.vue";
import NavigationUndoNotice from "@/components/NavigationUndoNotice.vue";
import { useI18n } from "@/i18n";
import { navDockLabel } from "@/services/navDockLabel";
import { scrollHorizontalOnWheel } from "@/services/horizontalWheel";
import { useNavStore } from "@/stores/navStore";
import { useLinksStore } from "@/stores/linksStore";
import type { BrowserTab } from "@/types/browserTabs";
import type { SavedLink } from "@/types/links";
import type { NavShortcut } from "@/types/navShortcuts";

const props = defineProps<{
  incomingTab: BrowserTab | null;
  incomingLink: SavedLink | null;
  availableTabs?: BrowserTab[];
  confirmRemove: (message: string) => Promise<boolean>;
}>();

const navStore = useNavStore();
const { shortcuts, errorMessage } = storeToRefs(navStore);
const { t } = useI18n();

const isManaging = ref(false);
const isFormOpen = ref(false);
const editingId = ref("");
const removedShortcuts = ref<NavShortcut[]>([]);
const isSaving = ref(false);
const isMutating = ref(false);
const draggingId = ref("");
const isDragOver = ref(false);
const urlInput = ref<HTMLInputElement | null>(null);
const titleInput = ref<HTMLInputElement | null>(null);
const manageButton = ref<HTMLButtonElement | null>(null);
const navigationTrack = ref<HTMLDivElement | null>(null);
const form = ref({ title: "", url: "", icon: "" });
const titleWasEdited = ref(false);
const linksStore = useLinksStore();
let returnFocus: HTMLElement | null = null;

const normalizedFormUrl = computed(() => {
  const value = form.value.url.trim();
  if (!value) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
});
const suggestedSite = computed(() => {
  const url = normalizedFormUrl.value;
  const tab = props.availableTabs?.find((item) => item.url === url);
  const link = linksStore.groups.flatMap((group) => group.links).find((item) => item.url === url);
  return {
    title: navDockLabel(tab?.title || link?.title || "", url),
    icon: tab?.favIconUrl || link?.favicon_url
  };
});
watch(() => form.value.url, () => {
  navStore.errorMessage = "";
  if (!editingId.value && !titleWasEdited.value) form.value.title = suggestedSite.value.title;
});
const lastRemoved = computed(() => removedShortcuts.value.at(-1));

const canAcceptExternal = computed(() => Boolean(props.incomingTab?.url || props.incomingLink?.url));

const moveIds = (shortcutId: string, direction: -1 | 1) => {
  const ids = shortcuts.value.map((shortcut) => shortcut.id);
  const index = ids.indexOf(shortcutId);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) {
    return null;
  }

  const nextIds = [...ids];
  const [moved] = nextIds.splice(index, 1);
  nextIds.splice(nextIndex, 0, moved ?? shortcutId);
  return nextIds;
};

// While dragging, the list renders a preview order so neighbours slide aside and
// leave a gap at the slot under the pointer. `null` means no preview.
type DockEntry = { id: string; shortcut?: NavShortcut };

const INCOMING_PLACEHOLDER_ID = "__incoming-placeholder__";
const DEFAULT_SLOT_WIDTH = 88;
const DEFAULT_SLOT_GAP = 12;

const previewIndex = ref<number | null>(null);
const isPlacingIncoming = ref(false);

const displayEntries = computed<DockEntry[]>(() => {
  const entries: DockEntry[] = shortcuts.value.map((shortcut) => ({ id: shortcut.id, shortcut }));
  const index = previewIndex.value;

  if (index === null) {
    return entries;
  }

  if (draggingId.value) {
    const from = entries.findIndex((entry) => entry.id === draggingId.value);

    if (from < 0) {
      return entries;
    }

    const [moved] = entries.splice(from, 1);
    entries.splice(Math.min(index, entries.length), 0, moved as DockEntry);
    return entries;
  }

  if ((isDragOver.value && canAcceptExternal.value) || isPlacingIncoming.value) {
    entries.splice(Math.min(index, entries.length), 0, { id: INCOMING_PLACEHOLDER_ID });
  }

  return entries;
});

// Every card has the same width, so the slot under the pointer is derived from
// geometry that does not move while neighbours animate. That keeps the target
// stable and avoids the flicker of hit-testing against shifting cards.
const slotIndexFromPointer = (event: DragEvent) => {
  const list = navigationTrack.value?.querySelector<HTMLElement>(".quick-nav-list");
  const lastIndex = draggingId.value ? shortcuts.value.length - 1 : shortcuts.value.length;

  if (!list || lastIndex <= 0) {
    return 0;
  }

  const first = list.firstElementChild;
  const width = first instanceof HTMLElement && first.offsetWidth > 0 ? first.offsetWidth : DEFAULT_SLOT_WIDTH;
  const gap = Number.parseFloat(getComputedStyle(list).columnGap) || DEFAULT_SLOT_GAP;
  const slot = Math.floor((event.clientX - list.getBoundingClientRect().left) / (width + gap));
  return Math.max(0, Math.min(slot, lastIndex));
};

const openForm = async (shortcut?: NavShortcut) => {
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  navStore.errorMessage = "";
  editingId.value = shortcut?.id ?? "";
  form.value = {
    title: shortcut ? navDockLabel(shortcut.title, shortcut.url) : "",
    url: shortcut?.url ?? "",
    icon: shortcut?.favicon_url ?? ""
  };
  titleWasEdited.value = Boolean(shortcut);
  isFormOpen.value = true;
  await nextTick();
  (shortcut ? titleInput.value : urlInput.value)?.focus();
};
const closeForm = async () => {
  if (isSaving.value) return;
  isFormOpen.value = false;
  await nextTick();
  if (returnFocus?.isConnected) returnFocus.focus();
  else manageButton.value?.focus();
};
const trapFormFocus = (event: KeyboardEvent) => {
  const dialog = event.currentTarget as HTMLElement;
  const controls = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), summary")]
    .filter((element) => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first?.focus();
  }
};
const saveForm = async () => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    const input = { title: form.value.title.trim() || suggestedSite.value.title,
      url: form.value.url, favicon_url: form.value.icon || (!editingId.value ? suggestedSite.value.icon : undefined) };
    if (editingId.value) await navStore.editShortcut({ ...input, id: editingId.value });
    else await navStore.addShortcut(input);
    isSaving.value = false;
    await closeForm();
  } catch {
    urlInput.value?.focus();
  } finally { isSaving.value = false; }
};
const removeShortcut = async (shortcut: NavShortcut) => {
  if (isMutating.value) return;
  isMutating.value = true;
  try {
    const confirmed = await props.confirmRemove(t("nav.deleteConfirm", { name: navDockLabel(shortcut.title, shortcut.url) }));
    if (!confirmed) return;
    await navStore.removeShortcut(shortcut.id);
    removedShortcuts.value.push(shortcut);
    await nextTick();
    manageButton.value?.focus();
  } catch { /* The dock displays the store error. */ }
  finally { isMutating.value = false; }
};
const undoRemove = async () => {
  if (!lastRemoved.value || isMutating.value) return;
  isMutating.value = true;
  try {
    await navStore.restoreShortcut(lastRemoved.value.id);
    removedShortcuts.value.pop();
    if (!lastRemoved.value) {
      await nextTick();
      manageButton.value?.focus();
    }
  } catch { /* Keep the undo action available after a failed restore. */ }
  finally { isMutating.value = false; }
};

const moveShortcut = async (shortcutId: string, direction: -1 | 1) => {
  const ids = moveIds(shortcutId, direction);

  if (!ids) {
    return;
  }

  await sortShortcuts(ids);
};

const sortShortcuts = async (ids: string[]) => {
  if (isMutating.value) return;
  isMutating.value = true;
  try { await navStore.sortShortcuts(ids); }
  catch { /* The dock displays the store error. */ }
  finally { isMutating.value = false; }
};

const onShortcutKeydown = (event: KeyboardEvent, shortcut: NavShortcut) => {
  if (!event.altKey || event.shiftKey || event.metaKey || event.ctrlKey) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    void moveShortcut(shortcut.id, -1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    void moveShortcut(shortcut.id, 1);
  }
};

const isPlainPrimaryClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const openShortcut = (event: MouseEvent, shortcut: NavShortcut) => {
  if (isManaging.value) {
    event.preventDefault();
    void openForm(shortcut);
    return;
  }
  if (!isPlainPrimaryClick(event)) {
    return;
  }

  event.preventDefault();
  void navStore.openShortcut(shortcut);
};

const openShortcutInBackground = (event: MouseEvent, shortcut: NavShortcut) => {
  if (isManaging.value) { event.preventDefault(); return; }
  if (event.button !== 1) {
    return;
  }

  event.preventDefault();
  void navStore.openShortcut(shortcut, { active: false });
};

const startShortcutDrag = (event: DragEvent, shortcut: NavShortcut) => {
  if (isMutating.value) { event.preventDefault(); return; }
  draggingId.value = shortcut.id;
  event.dataTransfer?.setData("text/plain", shortcut.url);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const endShortcutDrag = () => {
  draggingId.value = "";
  isDragOver.value = false;
  previewIndex.value = null;
};

const onDragOver = (event: DragEvent) => {
  if (!draggingId.value && !canAcceptExternal.value) {
    return;
  }

  event.preventDefault();
  isDragOver.value = true;
  previewIndex.value = slotIndexFromPointer(event);

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = draggingId.value || props.incomingLink ? "move" : "copy";
  }
};

const onDragLeave = (event: DragEvent) => {
  const next = event.relatedTarget;
  const current = event.currentTarget;

  if (next instanceof Node && current instanceof Node && current.contains(next)) {
    return;
  }

  isDragOver.value = false;

  // Leaving the dock closes the gap again, unless an incoming drop is being saved.
  if (!isPlacingIncoming.value) {
    previewIndex.value = null;
  }
};

const addIncoming = async (index: number | null) => {
  const tab = props.incomingTab;
  const link = props.incomingLink;
  const source = tab?.url
    ? { title: navDockLabel(tab.title, tab.url), url: tab.url, favicon_url: tab.favIconUrl }
    : link?.url
      ? { title: navDockLabel(link.title, link.url), url: link.url, favicon_url: link.favicon_url }
      : null;

  if (!source) {
    previewIndex.value = null;
    return;
  }

  // Keep the placeholder in its gap while the shortcut is written.
  isPlacingIncoming.value = true;

  try {
    const created = await navStore.addShortcut(source);
    const ids = shortcuts.value.map((shortcut) => shortcut.id).filter((id) => id !== created?.id);

    if (created) {
      ids.splice(Math.min(index ?? ids.length, ids.length), 0, created.id);
    }

    // Swap the placeholder for the real card in the same tick as the optimistic reorder.
    isPlacingIncoming.value = false;
    previewIndex.value = null;

    if (created) {
      await sortShortcuts(ids);
    }
  } catch {
    // Duplicate and invalid URLs surface through the store error.
  } finally {
    isPlacingIncoming.value = false;
    previewIndex.value = null;
  }
};

const commitDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  if (draggingId.value) {
    // The preview already shows the final order, so commit exactly what is on screen.
    const ids = displayEntries.value.map((entry) => entry.id);
    const changed = ids.some((id, position) => id !== shortcuts.value[position]?.id);
    draggingId.value = "";
    previewIndex.value = null;

    if (changed) {
      await sortShortcuts(ids);
    }

    return;
  }

  const index = previewIndex.value;
  await addIncoming(index);
};
</script>

<template>
  <section class="quick-nav" data-navigation-drop-target :class="{ 'is-managing': isManaging, 'is-reordering': Boolean(draggingId), 'is-drop-target': isDragOver && (Boolean(draggingId) || canAcceptExternal) }"
    :aria-label="t('nav.title')" @dragover="onDragOver" @dragleave="onDragLeave" @drop="commitDrop"
    @keydown.esc="isManaging = false" @wheel="scrollHorizontalOnWheel($event, navigationTrack)">
    <header class="quick-nav-header">
      <div class="quick-nav-heading">
        <h3>{{ t("nav.title") }}</h3>
        <p id="quick-nav-manage-hint" :title="isManaging ? t('nav.manageHint') : undefined">{{ isDragOver && canAcceptExternal ? t("nav.dropHint") : isManaging ? t("nav.manageHint") : t("nav.summary", { count: shortcuts.length }) }}</p>
      </div>
      <button ref="manageButton" class="quick-nav-manage" type="button" :aria-pressed="isManaging"
        @click="isManaging = !isManaging">{{ t(isManaging ? "nav.done" : "nav.manage") }}</button>
    </header>
    <div ref="navigationTrack" class="quick-nav-track">
      <p v-if="displayEntries.length === 0" class="quick-nav-empty">{{ t("nav.empty") }}</p>
      <TransitionGroup v-else tag="ul" name="quick-nav-shift" class="quick-nav-list">
        <li v-for="{ id, shortcut } in displayEntries" :key="id" class="quick-nav-item" :class="{ dragging: draggingId === id }"
          :draggable="Boolean(shortcut) && !isMutating" @dragstart="shortcut && startShortcutDrag($event, shortcut)" @dragend="endShortcutDrag">
          <span v-if="!shortcut" class="quick-nav-placeholder" aria-hidden="true" />
          <a v-else-if="!isManaging" class="quick-nav-link" :href="shortcut.url" :title="shortcut.title"
            :aria-label="navDockLabel(shortcut.title, shortcut.url)" :draggable="!isMutating" aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
            @click="openShortcut($event, shortcut)" @auxclick="openShortcutInBackground($event, shortcut)"
            @keydown="onShortcutKeydown($event, shortcut)">
            <span class="quick-nav-icon-frame">
              <FaviconImage img-class="quick-nav-icon" :page-url="shortcut.url" :stored-url="shortcut.favicon_url" :size="64" />
            </span>
            <span class="quick-nav-label">{{ navDockLabel(shortcut.title, shortcut.url) }}</span>
          </a>
          <div v-else class="quick-nav-edit-tile">
            <button class="quick-nav-link" type="button" :draggable="!isMutating" :aria-label="t('nav.editShortcut', { name: navDockLabel(shortcut.title, shortcut.url) })"
              aria-describedby="quick-nav-manage-hint" aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
              @click="openForm(shortcut)" @keydown="onShortcutKeydown($event, shortcut)">
              <span class="quick-nav-icon-frame">
                <FaviconImage img-class="quick-nav-icon" :page-url="shortcut.url" :stored-url="shortcut.favicon_url" :size="64" />
              </span>
              <span class="quick-nav-label">{{ navDockLabel(shortcut.title, shortcut.url) }}</span>
            </button>
            <span class="quick-nav-drag-mark" :title="t('nav.dragHint')" aria-hidden="true"><RowActionIcon name="grip" /></span>
            <span class="quick-nav-edit-mark" aria-hidden="true"><RowActionIcon name="pencil" /></span>
            <button class="quick-nav-remove" type="button" :disabled="isMutating"
              :aria-label="t('nav.removeShortcut', { name: navDockLabel(shortcut.title, shortcut.url) })"
              :title="t('common.delete')" @click="removeShortcut(shortcut)"><RowActionIcon name="trash" /></button>
          </div>
        </li>
      </TransitionGroup>
      <button v-if="isManaging" class="quick-nav-add" type="button" :title="t('nav.add')" @click="openForm()">
        <span aria-hidden="true"><RowActionIcon name="plus" /></span><span class="quick-nav-label">{{ t("common.add") }}</span>
      </button>
    </div>
    <p v-if="errorMessage && !isFormOpen" class="error-text" role="alert">{{ t(errorMessage) }}</p>
  </section>
  <NavigationUndoNotice v-if="lastRemoved"
    :notice-id="lastRemoved.id"
    :message="t('nav.removed', { name: navDockLabel(lastRemoved.title, lastRemoved.url) })"
    :action-label="t('nav.undo')" :busy="isMutating" @undo="undoRemove" />
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isFormOpen" class="modal-backdrop" @click.self="closeForm">
        <section class="data-dialog quick-nav-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-nav-dialog-title"
          @keydown.esc.stop="closeForm" @keydown.tab="trapFormFocus">
          <header class="data-dialog-header">
            <div><h2 id="quick-nav-dialog-title">{{ t(editingId ? "nav.edit" : "nav.add") }}</h2></div>
            <button class="close-button" type="button" :disabled="isSaving" :aria-label="t('common.close')" @click="closeForm"><RowActionIcon name="close" /></button>
          </header>
          <div class="data-dialog-body">
            <form class="quick-nav-form" @submit.prevent="saveForm">
              <label for="quick-nav-url">{{ t("common.url") }}</label>
              <input id="quick-nav-url" ref="urlInput" v-model="form.url" type="text" inputmode="url" autocomplete="url"
                placeholder="https://example.com" required :disabled="isSaving" />
              <label for="quick-nav-title">{{ t("nav.displayName") }}</label>
              <input id="quick-nav-title" ref="titleInput" v-model="form.title" type="text" :placeholder="t('nav.namePlaceholder')"
                :disabled="isSaving" @input="titleWasEdited = true" />
              <div v-if="normalizedFormUrl" class="quick-nav-preview">
                <span class="quick-nav-icon-frame">
                  <FaviconImage img-class="quick-nav-icon" :page-url="normalizedFormUrl" :stored-url="form.icon || suggestedSite.icon" :size="64" />
                </span>
                <span>{{ form.title || suggestedSite.title }}</span>
              </div>
              <details class="quick-nav-more">
                <summary>{{ t("nav.moreSettings") }}</summary>
                <label for="quick-nav-icon">{{ t("nav.icon") }}</label>
                <input id="quick-nav-icon" v-model="form.icon" type="url" :placeholder="t('nav.iconHint')" :disabled="isSaving" />
              </details>
              <p v-if="errorMessage" class="error-text" role="alert">{{ t(errorMessage) }}</p>
              <div class="quick-nav-form-actions">
                <button class="secondary-form-button" type="button" :disabled="isSaving" @click="closeForm">{{ t("common.cancel") }}</button>
                <button class="primary-button" type="submit" :disabled="isSaving">{{ t(editingId ? "common.save" : "common.add") }}</button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
