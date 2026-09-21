<script setup lang="ts">
defineProps<{
  name: "plus" | "grip" | "pencil" | "trash" | "close";
}>();
</script>

<template>
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    :class="{ 'row-action-icon-fill': name === 'grip' }"
  >
    <template v-if="name === 'plus'">
      <path d="M10 4.5v11M4.5 10h11" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="m5 5 10 10M15 5 5 15" />
    </template>
    <template v-else-if="name === 'pencil'">
      <path d="M4 14.5V16h1.5L14.8 6.7l-1.5-1.5L4 14.5ZM12.6 5.9l1.5 1.5" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M5 6.5h10" />
      <path d="M8 6.5V5h4v1.5" />
      <path d="M6.5 6.5v9.2h7V6.5" />
      <path d="M9 9v4.2M11 9v4.2" />
    </template>
    <template v-else>
      <circle cx="7.25" cy="5.5" r="1.15" />
      <circle cx="12.75" cy="5.5" r="1.15" />
      <circle cx="7.25" cy="10" r="1.15" />
      <circle cx="12.75" cy="10" r="1.15" />
      <circle cx="7.25" cy="14.5" r="1.15" />
      <circle cx="12.75" cy="14.5" r="1.15" />
    </template>
  </svg>
</template>
