<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getFaviconCandidates } from "@/services/faviconUrl";
import {
  cachedFavicon,
  faviconInitial,
  isSameFaviconSite,
  preloadFavicon,
  rememberFavicon
} from "@/services/faviconLoader";

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
  async (_next, previous) => {
    const current = ++generation;
    const pageUrl = props.pageUrl;
    const candidates = getFaviconCandidates(pageUrl, props.storedUrl, props.size, props.knownIconOnly);
    const cached = cachedFavicon(pageUrl, candidates);
    // Keep the current image while a same-site replacement loads instead of
    // dropping back to the initial letter for a frame.
    if (cached || !displayedSrc.value || !isSameFaviconSite(previous?.[0] as string | undefined, pageUrl)) {
      displayedSrc.value = cached;
    }
    for (const src of candidates) {
      const success = await preloadFavicon(src);
      if (current !== generation) return;
      if (success) {
        rememberFavicon(pageUrl, src, candidates);
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
      <img v-if="displayedSrc" class="favicon-image"
        :src="displayedSrc" alt="" @error="displayedSrc = undefined" />
    </Transition>
  </span>
</template>
