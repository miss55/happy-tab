<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getFaviconCandidates } from "@/services/faviconUrl";

const props = defineProps<{
  pageUrl?: string;
  storedUrl?: string;
  imgClass: string;
}>();

const candidateIndex = ref(0);
const candidates = computed(() => getFaviconCandidates(props.pageUrl, props.storedUrl));
const currentSrc = computed(() => candidates.value[candidateIndex.value]);

watch(
  () => [props.pageUrl, props.storedUrl],
  () => {
    candidateIndex.value = 0;
  }
);

const onError = () => {
  candidateIndex.value += 1;
};
</script>

<template>
  <img
    v-if="currentSrc"
    :class="imgClass"
    :src="currentSrc"
    alt=""
    loading="lazy"
    @error="onError"
  />
  <span v-else :class="[imgClass, 'placeholder']" aria-hidden="true"></span>
</template>
