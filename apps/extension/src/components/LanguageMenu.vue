<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n, type SupportedLocale } from "@/i18n";

const props = defineProps<{
  modelValue: SupportedLocale;
}>();

const emit = defineEmits<{
  change: [locale: SupportedLocale];
}>();

const { localeLabelKeys, supportedLocales, t } = useI18n();
const container = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const isOpen = ref(false);

const getLocaleLabel = (locale: SupportedLocale) => t(localeLabelKeys[locale]);

const focusOption = async (index: number) => {
  await nextTick();
  const options = menu.value?.querySelectorAll<HTMLButtonElement>("[role='option']");
  options?.[Math.max(0, Math.min(index, options.length - 1))]?.focus();
};

const openMenu = (focusOffset = 0) => {
  isOpen.value = true;
  const selectedIndex = supportedLocales.indexOf(props.modelValue);
  void focusOption(selectedIndex + focusOffset);
};

const closeMenu = () => {
  isOpen.value = false;
};

const toggleMenu = () => {
  if (isOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
};

const selectLocale = (locale: SupportedLocale) => {
  emit("change", locale);
  closeMenu();
};

const handleTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    openMenu(event.key === "ArrowDown" ? 0 : supportedLocales.length - 1);
  }
};

const handleMenuKeydown = (event: KeyboardEvent) => {
  const options = Array.from(
    menu.value?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []
  );
  const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
  let nextIndex = currentIndex;

  if (event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % options.length;
  } else if (event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + options.length) % options.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = options.length - 1;
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const locale = options[currentIndex]?.dataset.locale as SupportedLocale | undefined;
    if (locale) {
      selectLocale(locale);
    }
    return;
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    container.value?.querySelector<HTMLButtonElement>(".language-menu-trigger")?.focus();
    return;
  } else if (event.key === "Tab") {
    closeMenu();
    return;
  } else {
    return;
  }

  event.preventDefault();
  options[nextIndex]?.focus();
};

const closeOnOutsidePointer = (event: PointerEvent) => {
  if (!container.value?.contains(event.target as Node)) {
    closeMenu();
  }
};

onMounted(() => document.addEventListener("pointerdown", closeOnOutsidePointer));
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeOnOutsidePointer));
</script>

<template>
  <div ref="container" class="language-menu">
    <span class="visually-hidden">{{ t("language.label") }}</span>
    <button
      class="language-menu-trigger"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-label="t('language.label')"
      @click="toggleMenu"
      @keydown="handleTriggerKeydown"
    >
      <span>{{ getLocaleLabel(modelValue) }}</span>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      ref="menu"
      class="language-menu-popover"
      role="listbox"
      :aria-label="t('language.label')"
      @keydown="handleMenuKeydown"
    >
      <button
        v-for="optionLocale in supportedLocales"
        :key="optionLocale"
        type="button"
        role="option"
        :data-locale="optionLocale"
        :aria-selected="modelValue === optionLocale"
        @click="selectLocale(optionLocale)"
      >
        <span>{{ getLocaleLabel(optionLocale) }}</span>
        <svg v-if="modelValue === optionLocale" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m3.5 8 3 3 6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>
