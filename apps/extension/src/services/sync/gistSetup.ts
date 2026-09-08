export const GIST_TOKEN_SETTINGS_URL = "https://github.com/settings/personal-access-tokens";
export const GIST_CREATE_URL = "https://gist.github.com/";
export const GIST_DEFAULT_FILENAME = "happy_tab_sync.json";

export { PLACEHOLDER_SYNC_JSON as GIST_PLACEHOLDER_JSON } from "./placeholderSnapshot";

export const isGistConfigured = (token?: string, gistId?: string): boolean =>
  Boolean(token?.trim() && gistId?.trim());
