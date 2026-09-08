import type { ProviderType, StorageProvider } from "../types";
import { JsonBinProvider } from "./jsonbinProvider";
import { GistProvider } from "./gistProvider";
import { CloudflareKvProvider } from "./cloudflareKvProvider";
import { UpstashRedisProvider } from "./upstashRedisProvider";
import { CustomRestProvider } from "./customRestProvider";

export { JsonBinProvider } from "./jsonbinProvider";
export { GistProvider } from "./gistProvider";
export { CloudflareKvProvider } from "./cloudflareKvProvider";
export { UpstashRedisProvider } from "./upstashRedisProvider";
export { CustomRestProvider } from "./customRestProvider";

const providerRegistry: Record<ProviderType, StorageProvider> = {
  jsonbin: new JsonBinProvider(),
  gist: new GistProvider(),
  cloudflare_kv: new CloudflareKvProvider(),
  upstash_redis: new UpstashRedisProvider(),
  custom_rest: new CustomRestProvider()
};

export const getStorageProvider = (type: ProviderType): StorageProvider => {
  const provider = providerRegistry[type];
  if (!provider) {
    throw new Error(`Unsupported storage provider type: ${type}`);
  }
  return provider;
};

export const getAllProviders = (): StorageProvider[] => {
  return Object.values(providerRegistry);
};
