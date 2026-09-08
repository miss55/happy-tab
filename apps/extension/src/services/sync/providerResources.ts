import type { ProviderType } from "./types";

export interface ProviderResources {
  officialUrl?: string;
  documentationUrl?: string;
}

export const providerResources: Record<ProviderType, ProviderResources> = {
  jsonbin: {
    officialUrl: "https://jsonbin.io/",
    documentationUrl: "https://jsonbin.io/api-reference/access-keys/create"
  },
  gist: {
    officialUrl: "https://gist.github.com/",
    documentationUrl: "https://docs.github.com/en/rest/gists/gists"
  },
  cloudflare_kv: {
    officialUrl: "https://www.cloudflare.com/products/kv/",
    documentationUrl:
      "https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/values/"
  },
  upstash_redis: {
    officialUrl: "https://upstash.com/",
    documentationUrl: "https://upstash.com/docs/redis/features/restapi"
  },
  custom_rest: {}
};
