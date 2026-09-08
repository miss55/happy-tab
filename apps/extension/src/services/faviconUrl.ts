const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isPrivilegedFaviconUrl = (value: string): boolean => {
  const lower = value.trim().toLowerCase();
  return (
    lower.startsWith("chrome://") ||
    lower.startsWith("edge://") ||
    lower.startsWith("about:") ||
    lower.startsWith("extension://") ||
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("moz-extension://") ||
    lower.startsWith("data:")
  );
};

export const buildExtensionFaviconUrl = (pageUrl: string, size = 32): string | undefined => {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL || !isHttpUrl(pageUrl)) {
    return undefined;
  }

  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", String(size));
  return url.toString();
};

export const getFaviconCandidates = (pageUrl?: string, storedUrl?: string): string[] => {
  const candidates: string[] = [];
  const page = pageUrl?.trim();
  const stored = storedUrl?.trim();
  const extensionFavicon = page ? buildExtensionFaviconUrl(page) : undefined;

  if (extensionFavicon) {
    candidates.push(extensionFavicon);
  }

  if (stored && isHttpUrl(stored) && !isPrivilegedFaviconUrl(stored) && !candidates.includes(stored)) {
    candidates.push(stored);
  }

  return candidates;
};
