import { describe, expect, it } from "vitest";
import { navDockLabel } from "@/services/navDockLabel";

describe("navDockLabel", () => {
  it("keeps short brand names intact", () => {
    expect(navDockLabel("ChatGPT")).toBe("ChatGPT");
    expect(navDockLabel("DeepSeek")).toBe("DeepSeek");
    expect(navDockLabel("豆包")).toBe("豆包");
    expect(navDockLabel("QA入口", "https://example.com")).toBe("QA入口");
    expect(navDockLabel("My Docs", "https://example.com")).toBe("My Docs");
  });

  it("uses a short name instead of a page title", () => {
    expect(navDockLabel("GitHub · ChatGPT")).toBe("GitHub");
    expect(navDockLabel("哔哩哔哩（゜-゜）つロ 干杯~-bilibili")).toBe("哔哩哔哩");
    expect(navDockLabel("MDN Web Docs — the documentation")).toBe("MDN");
    expect(navDockLabel("豆包官方网站")).toBe("豆包");
    expect(navDockLabel("Welcome to a very long home page", "https://www.deepseek.com/chat")).toBe("deepseek");
  });
});
