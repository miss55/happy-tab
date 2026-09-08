const FALLBACK_EXTENSION_VERSION = "0.1.1";

export const getExtensionVersion = (): string => {
  if (typeof chrome === "undefined" || !chrome.runtime?.getManifest) {
    return FALLBACK_EXTENSION_VERSION;
  }

  try {
    const version = chrome.runtime.getManifest().version;
    return version || FALLBACK_EXTENSION_VERSION;
  } catch {
    return FALLBACK_EXTENSION_VERSION;
  }
};
