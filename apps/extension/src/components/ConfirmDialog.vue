<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const cancelButton = ref<HTMLButtonElement | null>(null);
const dialog = ref<HTMLElement | null>(null);
let returnFocus: HTMLElement | null = null;

const trapFocus = (event: KeyboardEvent) => {
  const buttons = dialog.value?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
  if (!buttons?.length) return;
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
};

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      await nextTick();
      if (returnFocus?.isConnected) returnFocus.focus();
      returnFocus = null;
      return;
    }

    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    cancelButton.value?.focus();
  }
);
</script>

<template>
  <Transition name="modal">
  <div v-if="open" class="modal-backdrop confirm-dialog-backdrop" @click.self="emit('cancel')">
    <section
      ref="dialog"
      class="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      @keydown.esc.stop="emit('cancel')"
      @keydown.tab="trapFocus"
    >
      <header class="confirm-dialog-header">
        <span class="confirm-dialog-icon" aria-hidden="true">!</span>
        <h2 id="confirm-dialog-title">{{ title }}</h2>
      </header>
      <p id="confirm-dialog-message" class="confirm-dialog-message">{{ message }}</p>
      <div class="confirm-dialog-actions">
        <button ref="cancelButton" class="secondary-button" type="button" @click="emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button
          class="primary-button"
          type="button"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </section>
  </div>
  </Transition>
</template>
