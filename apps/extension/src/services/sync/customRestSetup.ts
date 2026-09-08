export class HttpsEndpointRequiredError extends Error {
  constructor() {
    super("cloud.httpsRequired");
    this.name = "HttpsEndpointRequiredError";
  }
}

export const isHttpsUrl = (url?: string): boolean => {
  try {
    const parsed = new URL(url?.trim() ?? "");
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const requireHttpsCustomRestEndpoint = (url?: string): void => {
  if (!isHttpsUrl(url)) {
    throw new HttpsEndpointRequiredError();
  }
};
