import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve("apps/extension/public/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const allowedPermissions = new Set(["tabs", "storage", "favicon"]);
const allowedOptionalHostPermissions = new Set(["https://api.cloudflare.com/*"]);
const requiredIconSizes = ["16", "32", "48", "128"];
const permissions = manifest.permissions ?? [];
const hostPermissions = manifest.host_permissions ?? [];
const optionalHostPermissions = manifest.optional_host_permissions ?? [];
const requiredLocaleMessages = ["appName", "appDescription"];
const supportedLocaleDirectories = ["en", "zh_CN", "zh_TW", "ja", "ko", "es", "fr", "de"];

const fail = (message) => {
  console.error(`Manifest check failed: ${message}`);
  process.exitCode = 1;
};

if (manifest.manifest_version !== 3) {
  fail("manifest_version must be 3.");
}

if (manifest.chrome_url_overrides?.newtab !== "index.html") {
  fail('chrome_url_overrides.newtab must be "index.html".');
}

if (manifest.default_locale !== "en") {
  fail('default_locale must be "en".');
}

if (manifest.name !== "__MSG_appName__" || manifest.description !== "__MSG_appDescription__") {
  fail("manifest name and description must use localized message placeholders.");
}

for (const localeDirectory of supportedLocaleDirectories) {
  const messagesPath = resolve(`apps/extension/public/_locales/${localeDirectory}/messages.json`);

  if (!existsSync(messagesPath)) {
    fail(`missing locale messages for "${localeDirectory}".`);
    continue;
  }

  const localeMessages = JSON.parse(readFileSync(messagesPath, "utf8"));
  for (const messageName of requiredLocaleMessages) {
    const message = localeMessages[messageName]?.message;

    if (!message) {
      fail(`locale "${localeDirectory}" is missing "${messageName}".`);
      continue;
    }

    if (messageName === "appDescription" && [...message].length > 132) {
      fail(`locale "${localeDirectory}" appDescription exceeds the Chrome 132-character limit.`);
    }
  }
}

if (!manifest.icons || typeof manifest.icons !== "object") {
  fail("manifest must declare icons.");
} else {
  for (const size of requiredIconSizes) {
    const iconPath = manifest.icons[size];

    if (!iconPath) {
      fail(`manifest is missing a ${size}px icon.`);
      continue;
    }

    if (!existsSync(resolve("apps/extension/public", iconPath))) {
      fail(`icon file is missing: ${iconPath}`);
    }
  }
}

for (const permission of permissions) {
  if (!allowedPermissions.has(permission)) {
    fail(`unexpected permission "${permission}".`);
  }
}

for (const requiredPermission of allowedPermissions) {
  if (!permissions.includes(requiredPermission)) {
    fail(`missing required permission "${requiredPermission}".`);
  }
}

if (hostPermissions.length > 0) {
  fail("install-time host_permissions are not allowed; use optional_host_permissions instead.");
}

for (const hostPermission of optionalHostPermissions) {
  if (!allowedOptionalHostPermissions.has(hostPermission)) {
    fail(`unexpected optional host permission "${hostPermission}".`);
  }
}

for (const requiredHostPermission of allowedOptionalHostPermissions) {
  if (!optionalHostPermissions.includes(requiredHostPermission)) {
    fail(`missing optional host permission "${requiredHostPermission}".`);
  }
}

if (process.exitCode !== 1) {
  console.log("Manifest check passed.");
}
