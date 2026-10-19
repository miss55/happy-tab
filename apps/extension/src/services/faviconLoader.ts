// Only keep successful icons in memory; nothing is sent to a third-party icon service.
const cache = new Map<string, string>();
const pending = new Map<string, Promise<boolean>>();
const CACHE_LIMIT = 512;

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

const candidatesKey = (candidates: readonly string[]): string | undefined =>
  candidates.length > 0 ? `candidates:${candidates.join("\n")}` : undefined;

export const isSameFaviconSite = (left?: string, right?: string): boolean => {
  const leftKey = siteKey(left);
  return Boolean(leftKey) && leftKey === siteKey(right);
};

/**
 * Exact candidate lists win so a remounted icon shows its own final image at once.
 * The site entry is only a fallback; sibling surfaces on one origin use different URLs.
 */
export const cachedFavicon = (pageUrl: string | undefined, candidates: readonly string[] = []): string | undefined => {
  const exactKey = candidatesKey(candidates);
  const exact = exactKey ? cache.get(exactKey) : undefined;
  if (exact) return exact;
  const key = siteKey(pageUrl);
  return key ? cache.get(key) : undefined;
};

const remember = (key: string, src: string) => {
  cache.delete(key);
  cache.set(key, src);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
};

export const rememberFavicon = (pageUrl: string | undefined, src: string, candidates: readonly string[] = []): void => {
  const exactKey = candidatesKey(candidates);
  if (exactKey) remember(exactKey, src);
  const key = siteKey(pageUrl);
  if (key) remember(key, src);
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
