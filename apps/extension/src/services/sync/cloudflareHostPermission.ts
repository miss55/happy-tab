export const CLOUDFLARE_API_HOST_PERMISSION = "https://api.cloudflare.com/*";

export class CloudflareHostPermissionDeniedError extends Error {
  constructor() {
    super("cloud.cfPermissionDenied");
    this.name = "CloudflareHostPermissionDeniedError";
  }
}

const getPermissionOrigins = () => ({ origins: [CLOUDFLARE_API_HOST_PERMISSION] });

const canRequestHostPermission = () =>
  typeof chrome !== "undefined" && typeof chrome.permissions?.request === "function";

export const hasCloudflareHostPermission = async (): Promise<boolean> => {
  if (!canRequestHostPermission()) {
    return true;
  }

  return chrome.permissions.contains(getPermissionOrigins());
};

export const ensureCloudflareHostPermission = async (): Promise<boolean> => {
  if (await hasCloudflareHostPermission()) {
    return true;
  }

  return chrome.permissions.request(getPermissionOrigins());
};

export const requireCloudflareHostPermission = async (): Promise<void> => {
  const granted = await ensureCloudflareHostPermission();
  if (!granted) {
    throw new CloudflareHostPermissionDeniedError();
  }
};
