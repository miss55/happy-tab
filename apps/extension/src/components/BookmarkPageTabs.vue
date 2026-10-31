<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useLinksStore } from "@/stores/linksStore";
import { useI18n } from "@/i18n";
import { DEFAULT_BOOKMARK_PAGE_ID } from "@/types/bookmarkPages";

const props = defineProps<{ locked: boolean; confirmRemove: (message: string) => Promise<boolean> }>();
const store = useLinksStore();
const { pages, activePageId, groups, linkCount } = storeToRefs(store);
const { t } = useI18n();
const list = ref<HTMLElement | null>(null);
const root = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const editor = ref<"create" | "rename" | null>(null);
const name = ref("");
const busy = ref(false);
const draggingPage = ref("");
const closeOnOutsidePointer = (event: PointerEvent) => {
  if (!busy.value && !root.value?.contains(event.target as Node)) editor.value = null;
};
onMounted(() => document.addEventListener("pointerdown", closeOnOutsidePointer));
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeOnOutsidePointer));
const current = computed(() => pages.value.find(page => page.id === activePageId.value));
const currentIndex = computed(() => pages.value.findIndex(page => page.id === activePageId.value));
const isEmpty = computed(() => !groups.value.some(group => group.page_id === activePageId.value));
const pageName = (page: { name: string }) => page.name || t("pages.default");

const revealActive = async () => {
  await nextTick();
  list.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
};
watch(activePageId, () => { editor.value = null; void revealActive(); });
watch(() => pages.value.map(page => page.id).join("\0"), () => { void revealActive(); }, { flush: "post" });

const select = async (id: string, focus = false) => {
  if (props.locked || busy.value) return;
  await store.selectPage(id);
  await revealActive();
  if (focus) list.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
};
const openEditor = async (mode: "create" | "rename") => {
  if (props.locked || busy.value) return;
  editor.value = mode;
  name.value = mode === "rename" && current.value ? pageName(current.value) : "";
  await nextTick();
  input.value?.focus();
  input.value?.select();
};
const managePage = async (id: string) => {
  if (props.locked || busy.value) return;
  await select(id);
  await openEditor("rename");
};
const togglePageMenu = (id: string) => {
  if (id !== activePageId.value) { void managePage(id); return; }
  if (editor.value === "rename") editor.value = null;
  else void openEditor("rename");
};
const run = async (action: () => Promise<unknown>) => {
  if (busy.value || props.locked) return;
  busy.value = true;
  try { await action(); editor.value = null; }
  catch { /* The store exposes a translated error in the workspace. */ }
  finally { busy.value = false; }
};
const save = () => run(() => store.savePage(name.value, editor.value === "rename" ? activePageId.value : undefined));
const remove = async () => {
  if (!current.value || !isEmpty.value || activePageId.value === DEFAULT_BOOKMARK_PAGE_ID) return;
  const id = activePageId.value;
  if (await props.confirmRemove(t("pages.deleteConfirm", { name: pageName(current.value) }))) {
    await run(() => store.deletePage(id));
  }
};
const reorder = (source: string, target: string) => {
  if (!source || source === target) return;
  const ids = pages.value.map(page => page.id);
  const from = ids.indexOf(source);
  const to = ids.indexOf(target);
  if (from < 0 || to < 0) return;
  ids.splice(to, 0, ...ids.splice(from, 1));
  void run(() => store.sortPages(ids));
};
const onKey = (event: KeyboardEvent) => {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const count = pages.value.length;
  const index = event.key === "Home" ? 0 : event.key === "End" ? count - 1 :
    (currentIndex.value + (event.key === "ArrowRight" ? 1 : -1) + count) % count;
  if (pages.value[index]) void select(pages.value[index].id, true);
};
const startDrag = (event: DragEvent, id: string) => {
  if (props.locked || busy.value) { event.preventDefault(); return; }
  draggingPage.value = id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-tabvia-bookmark-page", id);
  }
};
const drop = (event: DragEvent, id: string) => {
  if (!draggingPage.value) return;
  event.preventDefault();
  event.stopPropagation();
  const source = draggingPage.value;
  draggingPage.value = "";
  reorder(source, id);
};
</script>

<template>
  <div ref="root" class="bookmark-pages" :aria-busy="busy">
    <div class="bookmark-page-bar">
      <div ref="list" class="bookmark-page-list" role="tablist" :aria-label="t('pages.title')" @keydown="onKey">
        <div v-for="page in pages" :key="page.id" class="bookmark-page-item" :class="{ active: page.id === activePageId }" role="presentation">
        <button :id="`bookmark-page-${page.id}`"
          class="bookmark-page-tab" :class="{ active: page.id === activePageId, dragging: draggingPage === page.id }"
          type="button" role="tab" :aria-selected="page.id === activePageId" aria-controls="bookmark-page-content"
          :tabindex="page.id === activePageId ? 0 : -1" :title="pageName(page)" :disabled="locked || busy"
          :draggable="!locked && !busy" @click="select(page.id)" @contextmenu.prevent="managePage(page.id)"
          @keydown.shift.f10.prevent="managePage(page.id)" @dragstart.stop="startDrag($event, page.id)"
          @dragend="draggingPage = ''" @dragover="draggingPage && $event.preventDefault()" @drop="drop($event, page.id)">
          <span>{{ pageName(page) }}</span>
        </button>
        <button class="bookmark-page-menu" type="button" :tabindex="page.id === activePageId ? 0 : -1"
          :title="t('pages.manage')" :aria-label="t('pages.manage')" aria-controls="bookmark-page-editor"
          :disabled="locked || busy" :aria-expanded="page.id === activePageId && editor === 'rename'"
          @click="togglePageMenu(page.id)">⋯</button>
        </div>
      </div>
      <button class="bookmark-page-action bookmark-page-add" type="button" :title="t('pages.create')" :aria-label="t('pages.create')"
        :disabled="locked || busy" @click="openEditor('create')">+</button>
    </div>
    <p class="bookmark-page-summary">{{ t('bookmarks.summary', { count: linkCount }) }}</p>
    <form v-if="editor" id="bookmark-page-editor" class="bookmark-page-editor" @submit.prevent="save" @keydown.esc="editor = null">
      <label for="bookmark-page-name">{{ t(editor === 'create' ? 'pages.create' : 'pages.rename') }}</label>
      <div class="form-row">
        <input id="bookmark-page-name" ref="input" v-model="name" type="text" maxlength="60" required :disabled="busy" />
        <button type="submit" :disabled="busy || !name.trim()">{{ t('common.save') }}</button>
        <button class="secondary-form-button" type="button" :disabled="busy" @click="editor = null">{{ t('common.cancel') }}</button>
      </div>
      <div v-if="editor === 'rename'" class="bookmark-page-tools">
        <button type="button" class="secondary-form-button" :disabled="busy || currentIndex <= 0"
          @click="reorder(activePageId, pages[currentIndex - 1].id)">{{ t('pages.moveLeft') }}</button>
        <button type="button" class="secondary-form-button" :disabled="busy || currentIndex >= pages.length - 1"
          @click="reorder(activePageId, pages[currentIndex + 1].id)">{{ t('pages.moveRight') }}</button>
        <button type="button" class="secondary-form-button bookmark-page-delete" :disabled="busy || !isEmpty || activePageId === DEFAULT_BOOKMARK_PAGE_ID"
          @click="remove">{{ t('common.delete') }}</button>
        <span class="muted-text">{{ t(activePageId === DEFAULT_BOOKMARK_PAGE_ID ? 'pages.keepDefault' : 'pages.emptyOnly') }}</span>
      </div>
    </form>
  </div>
</template>

<style scoped>
.bookmark-pages { flex: 1 1 0; min-width: 0; }
.bookmark-page-bar { display: flex; align-items: center; gap: 4px; min-width: 0; }
.bookmark-page-list { display: flex; flex: 0 1 auto; gap: 4px; overflow-x: auto; min-width: 0; padding-block: 3px; scrollbar-width: thin; }
.bookmark-page-item { position: relative; display: flex; flex: 0 0 auto; align-items: center; border-bottom: 2px solid transparent; }
.bookmark-page-item.active { border-bottom-color: var(--theme-accent); }
.bookmark-page-tab { flex: 0 0 auto; box-sizing: border-box; max-width: 200px; min-height: 34px; padding: 6px 30px 6px 12px; border: 0; border-radius: var(--theme-radius-sm); color: var(--theme-muted); background: transparent; font-size: 14px; font-weight: 600; }
.bookmark-page-tab span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bookmark-page-tab.active { color: var(--theme-accent-text); }
.bookmark-page-tab.dragging { opacity: .5; }
.bookmark-page-action { flex: 0 0 28px; min-height: 28px; padding: 2px; border: 1px solid transparent; border-radius: var(--theme-radius-sm); color: var(--theme-muted); background: transparent; font-size: 18px; }
.bookmark-page-menu { position: absolute; inset-inline-end: 3px; min-height: 24px; width: 24px; padding: 0; border: 0; border-radius: var(--theme-radius-sm); color: var(--theme-muted); background: transparent; font-size: 18px; opacity: 0; }
.bookmark-page-item:hover .bookmark-page-menu, .bookmark-page-item:focus-within .bookmark-page-menu, .bookmark-page-menu[aria-expanded="true"] { opacity: 1; }
.bookmark-page-tab:hover, .bookmark-page-action:hover, .bookmark-page-menu:hover { color: var(--theme-accent-text); background: var(--theme-accent-soft); }
.bookmark-page-tab:focus-visible, .bookmark-page-action:focus-visible, .bookmark-page-menu:focus-visible { outline: 2px solid var(--theme-accent); outline-offset: -2px; }
.bookmark-page-editor { position: absolute; top: calc(100% + 8px); left: 16px; z-index: 20; box-sizing: border-box; display: grid; gap: 10px; width: min(440px, calc(100% - 32px)); padding: 16px; border: 1px solid var(--theme-border); border-radius: var(--theme-radius-md); color: var(--theme-surface-text); background: var(--theme-surface); box-shadow: var(--theme-floating-shadow); }
.bookmark-page-editor > label { font-size: 13px; font-weight: 600; }
.bookmark-page-editor input { min-width: 0; flex: 1; border-radius: var(--theme-radius-sm); }
.bookmark-page-editor button { min-height: var(--theme-control-height); padding: 0 12px; border: 1px solid var(--theme-border); border-radius: var(--theme-radius-sm); color: var(--theme-surface-text); background: var(--theme-surface); font-weight: 600; cursor: pointer; }
.bookmark-page-editor button:hover:not(:disabled) { border-color: var(--theme-accent); color: var(--theme-accent-text); background: var(--theme-accent-soft); }
.bookmark-page-editor button[type="submit"] { border-color: var(--theme-accent); color: var(--theme-accent-contrast); background: var(--theme-accent); }
.bookmark-page-editor button[type="submit"]:hover:not(:disabled) { border-color: var(--theme-accent-strong); color: var(--theme-accent-hover-contrast); background: var(--theme-accent-strong); }
.bookmark-page-editor .bookmark-page-delete { color: var(--theme-danger); }
.bookmark-page-editor .bookmark-page-delete:hover:not(:disabled) { border-color: var(--theme-danger); color: var(--theme-danger); background: var(--theme-danger-soft); }
.bookmark-page-editor button:focus-visible { outline: 2px solid var(--theme-accent); outline-offset: 2px; }
.bookmark-page-editor button:disabled { cursor: not-allowed; }
.bookmark-page-editor .form-row { grid-template-columns: minmax(0, 1fr) auto auto; }
.bookmark-page-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.bookmark-page-tools span { font-size: 12px; }
.bookmark-page-summary { margin: 2px 0 0; padding-inline: 12px; color: var(--theme-muted); font-size: 12px; }
@media (max-width: 560px) {
  .bookmark-page-tab { max-width: 144px; padding-inline: 8px 30px; }
  .bookmark-page-summary { padding-inline: 8px; }
  .bookmark-page-action { flex-basis: 24px; }
  .bookmark-page-editor .form-row { grid-template-columns: minmax(0, 1fr) auto; }
}
@media (hover: none) {
  .bookmark-page-menu { opacity: 1; }
}
</style>
