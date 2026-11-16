<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "@/i18n";

const props = defineProps<{
  open: boolean;
  title: string;
  titleId: string;
  busy: boolean;
}>();
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const dialog = ref<HTMLElement | null>(null);
let returnFocus: HTMLElement | null = null;

const close = () => {
  if (!props.busy) emit("close");
};

const trapFocus = (event: KeyboardEvent) => {
  const controls = [...(dialog.value?.querySelectorAll<HTMLElement>(
    "button:not(:disabled), input:not(:disabled), select:not(:disabled), summary"
  ) ?? [])].filter(element => element.getClientRects().length > 0 && !element.matches(":disabled"));
  const first = controls[0];
  const last = controls.at(-1);
  if (!first) {
    event.preventDefault();
    dialog.value?.focus();
  } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.value)) {
    event.preventDefault();
    first.focus();
  }
};

watch(() => props.open, async open => {
  if (open) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    dialog.value?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  } else {
    await nextTick();
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }
});

watch(() => props.busy, async busy => {
  await nextTick();
  if (!props.open || dialog.value?.contains(document.activeElement)) return;
  const target = busy ? dialog.value : dialog.value?.querySelector<HTMLInputElement>("input");
  target?.focus({ preventScroll: true });
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop bookmark-edit-backdrop" @click.self="close">
        <section ref="dialog" class="data-dialog bookmark-edit-dialog" role="dialog" aria-modal="true"
          :aria-labelledby="titleId" :aria-busy="busy" tabindex="-1"
          @keydown.esc.stop.prevent="close" @keydown.tab="trapFocus">
          <header class="data-dialog-header">
            <h2 :id="titleId">{{ title }}</h2>
            <button class="close-button" type="button" :aria-label="t('common.close')" :disabled="busy" @click="close">×</button>
          </header>
          <div class="data-dialog-body">
            <fieldset class="bookmark-edit-fields" :disabled="busy">
              <slot />
            </fieldset>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bookmark-edit-dialog {
  width: min(520px, 100%);
}

.bookmark-edit-fields {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.bookmark-edit-fields :deep(.edit-form) {
  padding: 0;
  border: 0;
  background: transparent;
}

.bookmark-edit-fields :deep(.form-actions) {
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
