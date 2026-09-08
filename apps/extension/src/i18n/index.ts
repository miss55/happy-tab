import { readonly, ref } from "vue";
import { getLocalStorageValue, setLocalStorageValue } from "@/services/chromeStorage";
import { enMessages, messages, zhCNMessages, type MessageKey } from "@/i18n/messages";

export const supportedLocales = ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export type TranslationParams = Record<string, string | number>;

export const localeLabelKeys = {
  en: "language.en",
  "zh-CN": "language.zhCN",
  "zh-TW": "language.zhTW",
  ja: "language.ja",
  ko: "language.ko",
  es: "language.es",
  fr: "language.fr",
  de: "language.de"
} as const satisfies Record<SupportedLocale, MessageKey>;

const LOCALE_STORAGE_KEY = "happy_tab_locale";
const supportedLocaleSet = new Set<string>(supportedLocales);
const traditionalChineseTags = new Set(["hant", "tw", "hk", "mo"]);

export const normalizeLocale = (locale?: string): SupportedLocale => {
  if (typeof locale !== "string" || !locale.trim()) {
    return "en";
  }

  const tags = locale
    .trim()
    .replaceAll("_", "-")
    .toLowerCase()
    .split("-")
    .filter(Boolean);

  if (tags.length === 0) {
    return "en";
  }

  const compact = tags.join("-");
  const exactMatch = supportedLocales.find((item) => item.toLowerCase() === compact);

  if (exactMatch) {
    return exactMatch;
  }

  const language = tags[0];

  if (language === "zh") {
    return tags.some((tag) => traditionalChineseTags.has(tag)) ? "zh-TW" : "zh-CN";
  }

  return supportedLocaleSet.has(language) ? (language as SupportedLocale) : "en";
};

const getBrowserLocale = () => {
  if (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) {
    return chrome.i18n.getUILanguage();
  }

  return typeof navigator !== "undefined" ? navigator.language : "en";
};

const activeLocale = ref<SupportedLocale>(normalizeLocale(getBrowserLocale()));

const applyDocumentLanguage = (locale: SupportedLocale) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
};

export const translateMessage = (
  locale: SupportedLocale,
  key: MessageKey,
  params: TranslationParams = {}
) => {
  const template = messages[locale][key] || zhCNMessages[key] || enMessages[key];

  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder
  );
};

export const translate = (key: MessageKey, params?: TranslationParams) =>
  translateMessage(activeLocale.value, key, params);

const knownMessageKeys: Partial<Record<string, MessageKey>> = {
  "Unable to load browser tabs.": "error.loadBrowserTabs",
  "Unable to switch tabs.": "error.switchBrowserTab",
  "Unable to close tab.": "error.closeBrowserTab",
  "Unable to load saved links.": "error.loadLinks",
  "Unable to create group.": "error.createGroup",
  "Unable to create link.": "error.createLink",
  "Unable to rename group.": "error.renameGroup",
  "Unable to delete group.": "error.deleteGroup",
  "Unable to update link.": "error.updateLink",
  "Unable to delete link.": "error.deleteLink",
  "Unable to sort groups.": "error.sortGroups",
  "Unable to sort links.": "error.sortLinks",
  "Unable to load todos.": "error.loadTodos",
  "Unable to create todo.": "error.createTodo",
  "Unable to update todo.": "error.updateTodo",
  "Unable to delete todo.": "error.deleteTodo",
  "Unable to sort todos.": "error.sortTodos",
  "URL is required.": "error.urlRequired",
  "Group name is required.": "error.groupNameRequired",
  "Group is required.": "error.groupRequired",
  "Title is required.": "error.titleRequired",
  "Todo title is required.": "error.todoTitleRequired"
};

export const isMessageKey = (value: string): value is MessageKey =>
  Object.prototype.hasOwnProperty.call(enMessages, value);

export const messageKeyFromError = (error: unknown, fallback: MessageKey): MessageKey => {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const knownKey = knownMessageKeys[error.message];

  if (knownKey) {
    return knownKey;
  }

  return isMessageKey(error.message) ? error.message : fallback;
};

export const localizeMessage = (message: string) => {
  if (isMessageKey(message)) {
    return translate(message);
  }

  const knownKey = knownMessageKeys[message];

  if (knownKey) {
    return translate(knownKey);
  }

  return message;
};

export const initializeI18n = async () => {
  const storedLocale = await getLocalStorageValue<string>(LOCALE_STORAGE_KEY).catch(() => undefined);
  activeLocale.value = storedLocale ? normalizeLocale(storedLocale) : normalizeLocale(getBrowserLocale());
  applyDocumentLanguage(activeLocale.value);
};

export const setLocale = async (locale: SupportedLocale) => {
  activeLocale.value = normalizeLocale(locale);
  applyDocumentLanguage(activeLocale.value);
  await setLocalStorageValue(LOCALE_STORAGE_KEY, activeLocale.value);
};

export const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(activeLocale.value, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

export const useI18n = () => ({
  locale: readonly(activeLocale),
  localeLabelKeys,
  isMessageKey,
  localizeMessage,
  setLocale,
  supportedLocales,
  t: translate,
  formatDateTime
});
