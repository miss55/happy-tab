export const CLOUDFLARE_DASHBOARD_URL = "https://dash.cloudflare.com/";
export const CLOUDFLARE_KV_CONSOLE_URL = "https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces";
export const CLOUDFLARE_API_TOKENS_URL = "https://dash.cloudflare.com/profile/api-tokens";

export const isCloudflareKvConfigured = (
  accountId?: string,
  namespaceId?: string,
  apiToken?: string
): boolean => Boolean(accountId?.trim() && namespaceId?.trim() && apiToken?.trim());
