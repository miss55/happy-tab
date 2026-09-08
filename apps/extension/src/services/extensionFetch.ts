export const EXTENSION_FETCH_MESSAGE_TYPE = "happytab.fetch";

export type ExtensionFetchRequest = {
  type: typeof EXTENSION_FETCH_MESSAGE_TYPE;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type ExtensionFetchSuccess = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

export type ExtensionFetchFailure = {
  error: string;
};

export type ExtensionFetchResponse = ExtensionFetchSuccess | ExtensionFetchFailure;

export const isAllowedExtensionFetchUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "api.cloudflare.com";
  } catch {
    return false;
  }
};

const headersToRecord = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) return {};
  return Object.fromEntries(new Headers(headers).entries());
};

const canUseBackgroundFetch = (): boolean =>
  typeof chrome !== "undefined" && Boolean(chrome.runtime?.id && chrome.runtime.sendMessage);

export const extensionFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  if (!canUseBackgroundFetch()) {
    return fetch(url, init);
  }

  const response = (await chrome.runtime.sendMessage({
    type: EXTENSION_FETCH_MESSAGE_TYPE,
    url,
    method: init.method,
    headers: headersToRecord(init.headers),
    body: typeof init.body === "string" ? init.body : undefined
  } satisfies ExtensionFetchRequest)) as ExtensionFetchResponse | undefined;

  if (!response || "error" in response) {
    throw new TypeError(response?.error || "Extension fetch failed.");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};

export const performPrivilegedFetch = async (
  request: ExtensionFetchRequest,
  fetcher: typeof fetch = fetch
): Promise<ExtensionFetchResponse> => {
  if (request.type !== EXTENSION_FETCH_MESSAGE_TYPE || !isAllowedExtensionFetchUrl(request.url)) {
    return { error: "This URL is not allowed for extension fetch." };
  }

  try {
    const response = await fetcher(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to fetch" };
  }
};
