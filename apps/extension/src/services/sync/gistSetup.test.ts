import { describe, expect, it } from "vitest";
import {
  GIST_CREATE_URL,
  GIST_DEFAULT_FILENAME,
  GIST_PLACEHOLDER_JSON,
  GIST_TOKEN_SETTINGS_URL,
  isGistConfigured
} from "./gistSetup";
import { PLACEHOLDER_SYNC_SNAPSHOT } from "./placeholderSnapshot";

describe("gistSetup", () => {
  it("points setup links at HTTPS GitHub pages", () => {
    expect(GIST_TOKEN_SETTINGS_URL).toBe("https://github.com/settings/personal-access-tokens");
    expect(GIST_CREATE_URL).toBe("https://gist.github.com/");
  });

  it("uses the same empty snapshot JSON and default filename as the Gist provider", () => {
    expect(GIST_DEFAULT_FILENAME).toBe("happy_tab_sync.json");
    expect(JSON.parse(GIST_PLACEHOLDER_JSON)).toEqual(PLACEHOLDER_SYNC_SNAPSHOT);
  });

  it("treats Gist as configured only when token and Gist ID are both present", () => {
    expect(isGistConfigured("", "gist-id")).toBe(false);
    expect(isGistConfigured("token", "")).toBe(false);
    expect(isGistConfigured("  token  ", "  gist-id  ")).toBe(true);
  });
});
