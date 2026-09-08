const hasChromeStorage = () => typeof chrome !== "undefined" && Boolean(chrome.storage?.local);

export const getLocalStorageValue = async <T>(key: string): Promise<T | undefined> => {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(key);
    return result[key] as T | undefined;
  }

  const rawValue = window.localStorage.getItem(key);
  return rawValue ? (JSON.parse(rawValue) as T) : undefined;
};

export const setLocalStorageValue = async <T>(key: string, value: T): Promise<void> => {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeLocalStorageValue = async (key: string): Promise<void> => {
  if (hasChromeStorage()) {
    await chrome.storage.local.remove(key);
    return;
  }

  window.localStorage.removeItem(key);
};
