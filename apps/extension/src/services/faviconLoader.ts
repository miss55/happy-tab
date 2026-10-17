// Only keep successful icons in memory; nothing is sent to a third-party icon service.
const cache = new Map<string, string>();
const pending = new Map<string, Promise<boolean>>();
const CACHE_LIMIT = 128;

const siteKey = (pageUrl?: string): string | undefined => {
  try {
    const url = new URL(pageUrl || "");
    return /^https?:$/.test(url.protocol) ? url.origin : undefined;
  } catch {
    return undefined;
  }
};

export const faviconInitial = (pageUrl?: string): string => {
  try {
    return new URL(pageUrl || "").hostname.replace(/^www\./i, "").charAt(0).toUpperCase() || "·";
  } catch {
    return "·";
  }
};

export const cachedFavicon = (pageUrl?: string): string | undefined => {
  const key = siteKey(pageUrl);
  return key ? cache.get(key) : undefined;
};

export const rememberFavicon = (pageUrl: string | undefined, src: string): void => {
  const key = siteKey(pageUrl);
  if (!key) return;
  cache.delete(key);
  cache.set(key, src);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
};

export const preloadFavicon = (src: string): Promise<boolean> => {
  const existing = pending.get(src);
  if (existing) return existing;
  const request = new Promise<boolean>((resolve) => {
    const image = new Image();
    const finish = (success: boolean) => {
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(success);
    };
    const timer = setTimeout(() => finish(false), 8000);
    image.onload = () => finish(image.naturalWidth > 0);
    image.onerror = () => finish(false);
    image.src = src;
  });
  pending.set(src, request);
  void request.finally(() => pending.delete(src));
  return request;
};
