import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  getLocalStorageValue: vi.fn(),
  setLocalStorageValue: vi.fn()
}));

vi.mock("@/services/chromeStorage", () => storageMocks);

import {
  initializeI18n,
  localeLabelKeys,
  messageKeyFromError,
  normalizeLocale,
  setLocale,
  supportedLocales,
  translate,
  translateMessage
} from "@/i18n";
import { enMessages, messages } from "@/i18n/messages";

describe("i18n", () => {
  beforeEach(() => {
    storageMocks.getLocalStorageValue.mockReset();
    storageMocks.setLocalStorageValue.mockReset();
  });

  it.each([
    ["zh-CN", "zh-CN"],
    ["zh_CN", "zh-CN"],
    ["zh-TW", "zh-TW"],
    ["zh_TW", "zh-TW"],
    ["zh-HK", "zh-TW"],
    ["zh-Hant", "zh-TW"],
    ["zh", "zh-CN"],
    ["en-US", "en"],
    ["ja-JP", "ja"],
    ["ko-KR", "ko"],
    ["es-MX", "es"],
    ["fr-CA", "fr"],
    ["de-AT", "de"],
    [42 as unknown as string, "en"],
    [undefined, "en"]
  ] as const)("normalizes %s to a supported locale", (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });

  it("has complete translations for every supported locale", () => {
    const keys = Object.keys(enMessages).sort();

    expect([...supportedLocales]).toEqual(Object.keys(messages));

    for (const locale of supportedLocales) {
      expect(Object.keys(messages[locale]).sort()).toEqual(keys);
      expect(localeLabelKeys[locale] in enMessages).toBe(true);
    }
  });

  it("translates messages and interpolates parameters", () => {
    expect(translateMessage("zh-CN", "tabs.count", { count: 3 })).toBe("3 个标签页");
    expect(translateMessage("zh-TW", "tabs.count", { count: 3 })).toBe("3 個分頁");
    expect(translateMessage("ja", "tabs.count", { count: 3 })).toBe("3 タブ");
    expect(translateMessage("en", "bookmarks.savedFeedback", { title: "Docs", group: "Work" })).toBe(
      "“Docs” saved to Work."
    );
  });

  it("loads and persists the selected locale", async () => {
    storageMocks.getLocalStorageValue.mockResolvedValue("zh-CN");
    storageMocks.setLocalStorageValue.mockResolvedValue(undefined);

    await initializeI18n();
    expect(translate("top.bookmarks")).toBe("书签");

    await setLocale("zh-TW");
    expect(storageMocks.setLocalStorageValue).toHaveBeenCalledWith("happy_tab_locale", "zh-TW");
    expect(translate("top.bookmarks")).toBe("書籤");

    await setLocale("en");
    expect(storageMocks.setLocalStorageValue).toHaveBeenCalledWith("happy_tab_locale", "en");
    expect(translate("top.bookmarks")).toBe("Bookmarks");
  });

  it("translates the about dialog, including the version line", () => {
    expect(translateMessage("en", "about.description")).toContain("bookmark manager");
    expect(translateMessage("zh-CN", "about.description")).toContain("书签管理器");
    expect(translateMessage("en", "about.description")).toContain("8 languages");
    expect(translateMessage("zh-CN", "about.privacyTitle")).toBe("我们不收集任何数据");
    expect(translateMessage("zh-CN", "about.privacyBody")).toBe(
      "HappyTab 不收集你的书签、待办或浏览内容。数据默认只留在这台电脑的浏览器里。"
    );
    expect(translateMessage("en", "about.privacyBody")).toBe(
      "HappyTab does not collect your bookmarks, todos, or browsing content. By default, everything stays in this browser on this device."
    );
    expect(translateMessage("en", "about.privacyBody")).not.toMatch(/sync/i);
    expect(translateMessage("zh-CN", "about.privacyBody")).not.toMatch(/同步/);
    expect(translateMessage("en", "about.privacyPolicy")).toBe("Read the full privacy policy");
    expect(translateMessage("zh-CN", "about.privacyPolicy")).toBe("阅读完整隐私政策");
    expect(translateMessage("zh-CN", "about.version", { version: "0.1.1" })).toBe("版本 0.1.1");
    expect(translateMessage("en", "about.github")).toBe("View source on GitHub");
    expect(translateMessage("zh-CN", "about.github")).toBe("在 GitHub 上查看源码");
    expect(translateMessage("en", "about.syncAction")).toBe("Open cloud sync");
    expect(translateMessage("en", "about.version", { version: "0.1.1" })).toBe("Version 0.1.1");
    expect(translateMessage("zh-CN", "common.confirm")).toBe("确认");
    expect(translateMessage("en", "tabs.focused")).toBe("Current window");
    expect(translateMessage("zh-CN", "tabs.focused")).toBe("当前窗口");
    expect(translateMessage("en", "common.confirm")).toBe("Confirm");
    expect(translateMessage("ko", "common.confirm")).toBe("확인");
    expect(translateMessage("es", "common.confirm")).toBe("Confirmar");
    expect(translateMessage("fr", "common.confirm")).toBe("Confirmer");
    expect(translateMessage("de", "common.confirm")).toBe("Bestätigen");
    expect(translateMessage("en", "cloud.httpsRequired")).toBe(
      "Use an HTTPS URL. HappyTab does not send snapshots over HTTP."
    );
    expect(translateMessage("zh-CN", "cloud.syncSuccess")).toBe("同步完成。");
    expect(translateMessage("en", "cloud.syncSuccess")).toBe("Sync completed.");
  });

  it("maps known English errors to message keys", () => {
    expect(messageKeyFromError(new Error("URL is required."), "error.createLink")).toBe("error.urlRequired");
    expect(messageKeyFromError(new Error("IndexedDB failed"), "error.loadLinks")).toBe("error.loadLinks");
    expect(messageKeyFromError(undefined, "error.loadTodos")).toBe("error.loadTodos");
  });

  it("does not keep unused account-era keys", () => {
    expect("top.me" in enMessages).toBe(false);
    expect("top.logout" in enMessages).toBe(false);
    expect("common.open" in enMessages).toBe(false);
  });
});
