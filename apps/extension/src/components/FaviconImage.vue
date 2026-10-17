<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getFaviconCandidates } from "@/services/faviconUrl";
import { cachedFavicon, faviconInitial, preloadFavicon, rememberFavicon } from "@/services/faviconLoader";

const props = defineProps<{
  pageUrl?: string;
  storedUrl?: string;
  imgClass: string;
  size?: number;
  knownIconOnly?: boolean;
}>();

const displayedSrc = ref<string>();
const initial = computed(() => faviconInitial(props.pageUrl));
let generation = 0;

watch(
  () => [props.pageUrl, props.storedUrl, props.size, props.knownIconOnly],
  async () => {
    const current = ++generation;
    const pageUrl = props.pageUrl;
    displayedSrc.value = cachedFavicon(pageUrl);
    const candidates = getFaviconCandidates(pageUrl, props.storedUrl, props.size, props.knownIconOnly);
    for (const src of candidates) {
      const success = await preloadFavicon(src);
      if (current !== generation) return;
      if (success) {
        rememberFavicon(pageUrl, src);
        displayedSrc.value = src;
        return;
      }
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => { generation += 1; });
</script>

<template>
  <span :class="[imgClass, 'favicon-frame']" aria-hidden="true">
    <span class="favicon-initial">{{ initial }}</span>
    <Transition name="favicon-reveal">
      <img v-if="displayedSrc" :key="displayedSrc" class="favicon-image"
        :src="displayedSrc" alt="" @error="displayedSrc = undefined" />
    </Transition>
  </span>
</template>
