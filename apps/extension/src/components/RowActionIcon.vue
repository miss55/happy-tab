<script setup lang="ts">
import { GripVertical, Pencil, Plus, Trash2, X } from "@lucide/vue";

defineProps<{
  name: "plus" | "grip" | "pencil" | "trash" | "close";
}>();

const icons = { plus: Plus, grip: GripVertical, pencil: Pencil, trash: Trash2, close: X };
</script>

<template>
  <component
    :is="icons[name]"
    aria-hidden="true"
    class="row-action-icon"
    :size="16"
    :stroke-width="2"
  />
</template>
