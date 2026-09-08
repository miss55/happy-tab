import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { initializeI18n } from "@/i18n";
import { initializeTheme } from "@/services/theme";
import "./styles.css";

const bootstrap = async () => {
  await Promise.all([initializeI18n(), initializeTheme()]);
  createApp(App).use(createPinia()).mount("#app");
};

void bootstrap();
