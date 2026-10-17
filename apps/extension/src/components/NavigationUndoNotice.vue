<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{ noticeId: string; message: string; actionLabel: string; busy: boolean }>();
const emit = defineEmits<{ undo: [] }>();
const visible = ref(false);
const hovered = ref(false);
const focused = ref(false);
const paused = computed(() => hovered.value || focused.value || props.busy);
let timer: ReturnType<typeof setTimeout> | undefined;
const clearTimer = () => { clearTimeout(timer); timer = undefined; };
const scheduleHide = () => {
  clearTimer();
  if (visible.value && !paused.value) timer = setTimeout(() => { visible.value = false; }, 10000);
};
watch(() => [props.noticeId, props.message], () => {
  visible.value = true;
  scheduleHide();
}, { immediate: true });
watch(paused, scheduleHide);
const onFocusOut = (event: FocusEvent) => {
  focused.value = event.relatedTarget instanceof Node && (event.currentTarget as HTMLElement).contains(event.relatedTarget);
};
onBeforeUnmount(clearTimer);
</script>

<template>
  <Teleport to="body">
    <Transition name="navigation-notice">
      <div v-if="visible" class="quick-nav-notice" role="status" aria-live="polite" aria-atomic="true"
        @mouseenter="hovered = true" @mouseleave="hovered = false"
        @focusin="focused = true" @focusout="onFocusOut">
        <span>{{ message }}</span>
        <button type="button" :disabled="busy" @click="emit('undo')">{{ actionLabel }}</button>
      </div>
    </Transition>
  </Teleport>
</template>
