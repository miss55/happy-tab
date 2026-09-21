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

const confirmButton = ref<HTMLButtonElement | null>(null);

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }

    await nextTick();
    confirmButton.value?.focus();
  }
);
</script>

<template>
  <Transition name="modal">
  <div v-if="open" class="modal-backdrop confirm-dialog-backdrop" @click.self="emit('cancel')">
    <section
      class="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      @keydown.esc="emit('cancel')"
    >
      <header class="confirm-dialog-header">
        <span class="confirm-dialog-icon" aria-hidden="true">!</span>
        <h2 id="confirm-dialog-title">{{ title }}</h2>
      </header>
      <p id="confirm-dialog-message" class="confirm-dialog-message">{{ message }}</p>
      <div class="confirm-dialog-actions">
        <button class="secondary-button" type="button" @click="emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button
          ref="confirmButton"
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
