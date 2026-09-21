# HappyTab Architecture

HappyTab is a local-first bookmark manager that replaces the new tab page. It must work without login. Cloud sync is optional and uses user-owned third-party storage. HappyTab bookmarks are independent of the browser bookmark bar.

## Layout

- `apps/extension`: Chrome Manifest V3 new tab extension.
- `docs`: Project documentation.

There is no first-party API or backend.

## Extension

Stack:

- Vue 3 with Composition API.
- TypeScript.
- Vite.
- Pinia for UI state.
- Dexie for IndexedDB persistence.
- Chrome Manifest V3.

Chrome permissions:

- `tabs`
- `storage`
- `favicon`

Optional host permission, requested only when the user tests or runs Cloudflare KV sync:

- `https://api.cloudflare.com/*`

New tab override:

- `chrome_url_overrides.newtab = "index.html"`

## Local Data

Business data is stored in IndexedDB through Dexie:

- `link_groups`
- `links`
- `todos`
- `usage_stats`
- `sync_queue`

Syncable entities use stable UUIDs and include timestamp fields. Deletion uses `deleted_at` soft delete.

Current Dexie database:

- name: `happy_tab`
- version 1: `linkGroups`, `links`
- version 2: adds `todos`
- version 3: adds `link_groups`, `usage_stats`, and `sync_queue`, and copies
  legacy Link Groups into `link_groups`
- version 4: removes the legacy `linkGroups` table after the copy step

The v3 and v4 steps must stay separate so an upgrade from v1/v2 can read the
legacy table before it is removed.

Use `chrome.storage.local` only for lightweight settings:

- sync enabled flag and provider credentials
- theme settings
- last sync time
- language preference
- workspace flags such as whether the todo list is shown

## Domain Terms

- Browser Tab: currently opened Chrome tab from the Chrome tabs API.
- Link: saved user-managed item persisted by HappyTab.
- Link Group: user-defined group containing saved Links.
- Todo: local user-created task.

Browser Tabs and Links are separate concepts and should stay separate in code and UI copy.

## Cloud Sync

Sync is opt-in. The extension uploads an encrypted or plaintext snapshot to a storage provider the user already owns:

- JSONBin.io
- GitHub Gist
- Cloudflare KV
- Upstash Redis
- Custom REST endpoint

Conflict handling is last-write-wins based on item `updated_at`. Optional AES-256-GCM encryption runs in the extension before upload.
