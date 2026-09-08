export const JSONBIN_API_KEYS_URL = "https://jsonbin.io/app/app/api-keys";
export const JSONBIN_BINS_URL = "https://jsonbin.io/app/bins";

export {
  PLACEHOLDER_SYNC_JSON as JSONBIN_PLACEHOLDER_JSON,
  PLACEHOLDER_SYNC_SNAPSHOT as JSONBIN_PLACEHOLDER_SNAPSHOT
} from "./placeholderSnapshot";

export const isJsonBinConfigured = (apiKey?: string, binId?: string): boolean =>
  Boolean(apiKey?.trim() && binId?.trim());
