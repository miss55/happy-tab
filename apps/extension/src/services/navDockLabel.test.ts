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

describe("navigation names from descriptive titles and regional hosts", () => {
  it("does not use an English article as a site name", () => {
    expect(navDockLabel("The Agent Skills Directory", "https://www.skills.sh/")).toBe("skills");
    expect(navDockLabel("The", "https://www.skills.sh/")).toBe("skills");
    expect(navDockLabel("A collection of useful tools", "https://tools.example.com/")).toBe("tools");
  });

  it("separates a Chinese brand from its slogan", () => {
    expect(navDockLabel("阿里云-计算，为了无法计算的价值", "https://cn.aliyun.com/")).toBe("阿里云");
    expect(navDockLabel("阿里云—计算，为了无法计算的价值", "https://cn.aliyun.com/")).toBe("阿里云");
  });

  it("skips regional prefixes when titles are missing or were shortened incorrectly", () => {
    expect(navDockLabel("", "https://cn.aliyun.com/")).toBe("aliyun");
    expect(navDockLabel("cn", "https://cn.aliyun.com/")).toBe("aliyun");
    expect(navDockLabel("en", "https://en.example.com/")).toBe("example");
    expect(navDockLabel("", "https://www.zh-cn.example.com.cn/")).toBe("example");
    expect(navDockLabel("", "https://cn.com/")).toBe("cn");
    expect(navDockLabel("", "https://cn.com.cn/")).toBe("cn");
    expect(navDockLabel("", "https://docs.example.com/")).toBe("docs");
  });

  it("preserves meaningful short names and handles invalid URLs", () => {
    expect(navDockLabel("阿里云", "https://cn.aliyun.com/")).toBe("阿里云");
    expect(navDockLabel("云控制台", "https://cn.aliyun.com/")).toBe("云控制台");
    expect(navDockLabel("My Skills", "https://www.skills.sh/")).toBe("My Skills");
    expect(navDockLabel("V2EX", "https://v2ex.com/")).toBe("V2EX");
    expect(navDockLabel("Codex", "https://chatgpt.com/codex")).toBe("Codex");
    expect(navDockLabel("", "invalid URL")).toBe("");
  });
});
