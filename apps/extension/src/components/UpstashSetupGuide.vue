<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "@/i18n";
import { UPSTASH_CONSOLE_URL, UPSTASH_REDIS_CONSOLE_URL } from "@/services/sync/upstashSetup";

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
      <h3 id="upstash-setup-title">{{ t("cloud.setupSteps") }}</h3>
      <svg class="provider-setup-chevron" viewBox="0 0 20 20" aria-hidden="true">
        <path d="m5 8 5 5 5-5" />
      </svg>
    </summary>
    <ol class="provider-setup-steps">
      <li>
        <p>{{ t("cloud.upstashStep1") }}</p>
        <a :href="UPSTASH_CONSOLE_URL" target="_blank" rel="noopener noreferrer">
          {{ t("cloud.upstashOpenSignup") }} <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <p>{{ t("cloud.upstashStep2") }}</p>
        <a :href="UPSTASH_REDIS_CONSOLE_URL" target="_blank" rel="noopener noreferrer">
          {{ t("cloud.upstashOpenRedis") }} <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <p>{{ t("cloud.upstashStep3") }}</p>
      </li>
    </ol>
  </details>
</template>
