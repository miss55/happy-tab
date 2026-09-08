<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "@/i18n";
import {
  CLOUDFLARE_API_TOKENS_URL,
  CLOUDFLARE_DASHBOARD_URL,
  CLOUDFLARE_KV_CONSOLE_URL
} from "@/services/sync/cloudflareSetup";

const props = defineProps<{
  configured: boolean;
}>();

const { t } = useI18n();
const isOpen = ref(!props.configured);

const onToggle = (event: Event) => {
  const details = event.currentTarget as HTMLDetailsElement;
  isOpen.value = details.open;
};
</script>

<template>
  <details class="provider-setup-guide" :open="isOpen" @toggle="onToggle">
    <summary>
      <h3 id="cloudflare-setup-title">{{ t("cloud.setupSteps") }}</h3>
      <svg class="provider-setup-chevron" viewBox="0 0 20 20" aria-hidden="true">
        <path d="m5 8 5 5 5-5" />
      </svg>
    </summary>
    <ol class="provider-setup-steps">
      <li>
        <p>{{ t("cloud.cfStep1") }}</p>
        <a :href="CLOUDFLARE_DASHBOARD_URL" target="_blank" rel="noopener noreferrer">
          {{ t("cloud.cfOpenDashboard") }} <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <p>{{ t("cloud.cfStep2") }}</p>
        <a :href="CLOUDFLARE_KV_CONSOLE_URL" target="_blank" rel="noopener noreferrer">
          {{ t("cloud.cfOpenKv") }} <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <p>{{ t("cloud.cfStep3") }}</p>
        <a :href="CLOUDFLARE_API_TOKENS_URL" target="_blank" rel="noopener noreferrer">
          {{ t("cloud.cfOpenTokens") }} <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <p>{{ t("cloud.cfStep4") }}</p>
      </li>
      <li>
        <p>{{ t("cloud.cfPermissionHint") }}</p>
      </li>
    </ol>
  </details>
</template>
