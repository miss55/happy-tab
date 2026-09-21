<script setup lang="ts">
import { useI18n } from "@/i18n";
import { getExtensionVersion } from "@/services/extensionVersion";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  openSync: [];
}>();

const { t } = useI18n();
const version = getExtensionVersion();
const githubUrl = "https://github.com/miss55/happy-tab";
const privacyPolicyUrl =
  typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("privacy.html")
    : "privacy.html";
</script>

<template>
  <Transition name="modal">
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <section
      class="data-dialog about-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-dialog-title"
      @keydown.esc="emit('close')"
    >
      <header class="data-dialog-header">
        <div>
          <h2 id="about-dialog-title">{{ t("about.title") }}</h2>
          <p>{{ t("about.description") }}</p>
        </div>
        <button
          class="close-button"
          type="button"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          ×
        </button>
      </header>

      <div class="data-dialog-body">
      <section class="data-dialog-section about-section">
        <div>
          <h3>{{ t("about.usageTitle") }}</h3>
          <ol class="about-usage-list">
            <li>
              <strong>{{ t("about.usageTabsTitle") }}</strong>
              <p>{{ t("about.usageTabs") }}</p>
            </li>
            <li>
              <strong>{{ t("about.usageBookmarksTitle") }}</strong>
              <p>{{ t("about.usageBookmarks") }}</p>
            </li>
            <li>
              <strong>{{ t("about.usageTodosTitle") }}</strong>
              <p>{{ t("about.usageTodos") }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="data-dialog-section about-section">
        <div>
          <h3>{{ t("about.privacyTitle") }}</h3>
          <p>{{ t("about.privacyBody") }}</p>
          <p>
            <a :href="privacyPolicyUrl" target="_blank" rel="noopener noreferrer">
              {{ t("about.privacyPolicy") }}
            </a>
          </p>
        </div>
      </section>

      <section class="data-dialog-section">
        <div>
          <h3>{{ t("about.syncTitle") }}</h3>
          <p>{{ t("about.syncBody") }}</p>
          <p>{{ t("about.backupHint") }}</p>
        </div>
        <button type="button" @click="emit('openSync')">
          {{ t("about.syncAction") }}
        </button>
      </section>

      <p class="about-dialog-footer">
        <span>{{ t("about.version", { version }) }}</span>
        <span class="about-dialog-footer-sep" aria-hidden="true">·</span>
        <a :href="githubUrl" target="_blank" rel="noopener noreferrer">
          {{ t("about.github") }}
        </a>
      </p>
      </div>
    </section>
  </div>
  </Transition>
</template>
