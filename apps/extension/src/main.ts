import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { initializeI18n } from "@/i18n";
import { initializeTheme } from "@/services/theme";
import { initializeWorkspaceSettings } from "@/services/workspaceSettings";
import "./styles.css";

const bootstrap = async () => {
  await Promise.all([initializeI18n(), initializeTheme(), initializeWorkspaceSettings()]);
  createApp(App).use(createPinia()).mount("#app");
};

void bootstrap();
