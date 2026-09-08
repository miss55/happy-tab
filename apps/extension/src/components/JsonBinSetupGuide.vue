<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { useI18n } from "@/i18n";
import {
  JSONBIN_API_KEYS_URL,
  JSONBIN_BINS_URL,
  JSONBIN_PLACEHOLDER_JSON
} from "@/services/sync/jsonbinSetup";

const props = defineProps<{
  configured: boolean;
}>();

const { t } = useI18n();
const isOpen = ref(!props.configured);
const copied = ref(false);
let copiedTimer = 0;

const onToggle = (event: Event) => {
  const details = event.currentTarget as HTMLDetailsElement;
  isOpen.value = details.open;
};

const copyPlaceholderJson = async () => {
  const text = JSONBIN_PLACEHOLDER_JSON.trim();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }
  copied.value = true;
  window.clearTimeout(copiedTimer);
  copiedTimer = window.setTimeout(() => {
    copied.value = false;
  }, 2000);
};

onBeforeUnmount(() => {
  window.clearTimeout(copiedTimer);
});
</script>

<template>
  <details class="provider-setup-guide" :open="isOpen" @toggle="onToggle">
    <summary>
      <h3 id="jsonbin-setup-title">{{ t("cloud.setupSteps") }}</h3>
      <svg class="provider-setup-chevron" viewBox="0 0 20 20" aria-hidden="true">
        <path d="m5 8 5 5 5-5" />
      </svg>
    </summary>
    <ol class="provider-setup-steps">
      <li>
        <p>{{ t("cloud.jsonbinStep1") }}</p>
        <a :href="JSONBIN_API_KEYS_URL" target="_blank" rel="noopener noreferrer">
          {{ t("cloud.jsonbinOpenApiKeys") }} <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <p>{{ t("cloud.jsonbinStep2") }}</p>
        <a :href="JSONBIN_BINS_URL" target="_blank" rel="noopener noreferrer">
          {{ t("cloud.jsonbinOpenBins") }} <span aria-hidden="true">↗</span>
        </a>
        <pre class="provider-setup-json" tabindex="0">{{ JSONBIN_PLACEHOLDER_JSON.trim() }}</pre>
        <button class="secondary-button" type="button" @click="copyPlaceholderJson">
          {{ copied ? t("cloud.jsonCopied") : t("cloud.copyJson") }}
        </button>
      </li>
      <li>
        <p>{{ t("cloud.jsonbinStep3") }}</p>
      </li>
    </ol>
  </details>
</template>
