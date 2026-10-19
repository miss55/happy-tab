<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import FaviconImage from "@/components/FaviconImage.vue";
import { navDockLabel } from "@/services/navDockLabel";

type PreviewItem = { title: string; url: string; icon?: string };
type PreviewOptions = {
  element?: HTMLElement;
  keepGrabOffset?: boolean;
  variant?: "link" | "group";
};

const POINTER_GAP = 14;

const item = ref<PreviewItem | null>(null);
const isActive = ref(false);
const variant = ref<"link" | "group">("link");
const grabOffset = ref<{ x: number; y: number } | null>(null);
const isOverNavigation = ref(false);
const isVisible = ref(false);
const position = ref({ x: 0, y: 0 });
const sourcePreview = ref<HTMLElement | null>(null);
const transparentImage = ref<HTMLCanvasElement | null>(null);
const label = computed(() => item.value ? navDockLabel(item.value.title, item.value.url) : "");

const stop = () => {
  item.value = null;
  isActive.value = false;
  grabOffset.value = null;
  isVisible.value = false;
  isOverNavigation.value = false;
  sourcePreview.value?.replaceChildren();
  document.removeEventListener("dragover", move, true);
  document.removeEventListener("dragleave", leave, true);
  document.removeEventListener("drop", stop, true);
  document.removeEventListener("dragend", stop, true);
};

const move = (event: DragEvent) => {
  isOverNavigation.value = Boolean(item.value) && event.target instanceof Element &&
    Boolean(event.target.closest("[data-navigation-drop-target]"));
  const width = isOverNavigation.value ? 88 : sourcePreview.value?.offsetWidth ?? 88;
  const height = isOverNavigation.value ? 80 : sourcePreview.value?.offsetHeight ?? 40;
  const offset = !isOverNavigation.value && grabOffset.value
    ? { x: -grabOffset.value.x, y: -grabOffset.value.y }
    : { x: POINTER_GAP, y: POINTER_GAP };
  position.value = {
    x: Math.max(0, Math.min(event.clientX + offset.x, window.innerWidth - width - 4)),
    y: Math.max(0, Math.min(event.clientY + offset.y, window.innerHeight - height - 4))
  };
  isVisible.value = true;
};

const leave = (event: DragEvent) => {
  if (!event.relatedTarget && (event.clientX <= 0 || event.clientY <= 0 ||
    event.clientX >= window.innerWidth || event.clientY >= window.innerHeight)) {
    isVisible.value = false;
  }
};

const start = (event: DragEvent, source: PreviewItem | null, options: PreviewOptions = {}) => {
  stop();
  const original = options.element ?? event.currentTarget;
  if (!(original instanceof HTMLElement) || !event.dataTransfer || !transparentImage.value) return;
  // Native drag images cannot change after dragstart. Keep the native drop behavior,
  // but render a pointer-transparent preview that can change as the target changes.
  const rect = original.getBoundingClientRect();
  const clone = original.cloneNode(true) as HTMLElement;
  clone.style.width = `${rect.width}px`;
  clone.style.margin = "0";
  clone.style.removeProperty("grid-column");
  clone.style.removeProperty("grid-row");
  clone.classList.remove("dragging", "group-drop-before", "group-drop-after", "link-drop-target", "drop-before", "drop-after");
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  sourcePreview.value?.replaceChildren(clone);
  event.dataTransfer.setDragImage(transparentImage.value, 0, 0);
  item.value = source;
  variant.value = options.variant ?? "link";
  grabOffset.value = options.keepGrabOffset
    ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
    : null;
  isActive.value = true;
  move(event);
  document.addEventListener("dragover", move, true);
  document.addEventListener("dragleave", leave, true);
  document.addEventListener("drop", stop, true);
  document.addEventListener("dragend", stop, true);
};

defineExpose({ start });
onBeforeUnmount(stop);
</script>

<template>
  <Teleport to="body">
    <canvas ref="transparentImage" class="link-drag-transparent-image" width="1" height="1" aria-hidden="true" />
    <div class="link-drag-preview" :class="`is-${variant}`" :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      v-show="isVisible && isActive" aria-hidden="true" inert>
      <div ref="sourcePreview" class="link-drag-preview-source" v-show="!isOverNavigation" />
      <div v-if="item && isOverNavigation" class="quick-nav-link link-drag-navigation-preview">
        <span class="quick-nav-icon-frame">
          <FaviconImage img-class="quick-nav-icon" :page-url="item.url" :stored-url="item.icon" :size="64" />
        </span>
        <span class="quick-nav-label">{{ label }}</span>
      </div>
    </div>
  </Teleport>
</template>
