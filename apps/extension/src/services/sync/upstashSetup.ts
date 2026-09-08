export const UPSTASH_CONSOLE_URL = "https://console.upstash.com/";
export const UPSTASH_REDIS_CONSOLE_URL = "https://console.upstash.com/redis";

export const isUpstashConfigured = (url?: string, token?: string): boolean =>
  Boolean(url?.trim() && token?.trim());
