# HappyTab Extension

Chrome Manifest V3 new tab extension built with Vite, Vue 3, TypeScript, Pinia, and Dexie. The same package loads in Microsoft Edge.

## Current Local MVP

- Overrides Chrome new tab with `chrome_url_overrides`.
- Reads current browser windows and tabs through `chrome.windows.getAll({ populate: true })`.
- Displays Browser Tabs grouped by Chrome window.
- Switches to a Browser Tab and closes Browser Tabs.
- Saves Browser Tabs as local Links by button or by dragging them onto a Link Group.
- Creates, edits, deletes, and drag-sorts Link Groups.
- Creates, edits, deletes, opens, and drag-sorts SavedLinks.
- Supports SavedLink sorting within a group and across groups.
- Tracks Link `open_count` and `last_opened_at`.
- Creates, edits, completes, deletes, and drag-sorts Todos.
- Persists Todo `sort_order`.
- Persists business data in IndexedDB through Dexie.
- Supports English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, French, and German UI; initially follows the browser language, and remembers manual language changes locally.
- Exports active local business data to a versioned JSON backup.
- Imports validated HappyTab backups in safe merge mode or confirmed replace mode.
- Supports system, light, dark, and custom-color themes stored only in local extension settings.

## Cloud Storage Sync

The extension works 100% local-first and offline without requiring a custom server backend.

HappyTab supports syncing your data snapshot to third-party cloud storage:

- **JSONBin.io** (Access Key with Bins Read + Update + Bin ID; do not use the Master Key)
- **GitHub Gist** (Fine-grained token with Gists Read and write + Gist ID)
- **Cloudflare KV** (Account ID + Namespace ID + Custom Token with Workers KV Storage Read and Edit)
- **Upstash Redis** (HTTPS REST URL + REST Token; the Redis key is created on first sync)
- **Custom REST API** (Endpoint URL + Custom JSON Headers)

Features:
- Optional E2E encryption using AES-256-GCM (Web Crypto API) before uploading.
- Smart three-way timestamp merge (Last-Write-Wins based on item `updated_at`).
- Automatic or manual sync trigger.

## Development

From the repository root:

```sh
pnpm install
pnpm dev:extension
```

Build the extension:

```sh
pnpm build:extension
```

Run the extension tests:

```sh
pnpm --filter @happytab/extension test
```

The migration suite verifies fresh installs and upgrades from database versions
1, 2, and 3.

Validate the extension manifest:

```sh
pnpm check:manifest
```

## Chrome and Edge Manual Test

1. Run `pnpm build:extension`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode.
4. Choose "Load unpacked".
5. Select `apps/extension/dist`.
6. Open a new tab.

Expected behavior:

- Browser Tabs are grouped by Chrome window.
- Dragging a Browser Tab from the left sidebar onto a Link Group saves it locally.
- Switching the language updates the new tab UI immediately and remains selected after refresh.
- Exporting local data downloads a `happy-tab-backup-YYYY-MM-DD.json` file.
- Merge import keeps unrelated local records; replace import requires confirmation and restores only the backup.
- Invalid, unsupported, oversized, unsafe, or internally inconsistent backups do not change local data.
- Theme changes apply immediately, survive refresh, and can be reset to system mode.
- Clicking a Browser Tab switches to it.
- Closing a Browser Tab removes it from Chrome and the list.
- Saved Links and Todos persist after refreshing the new tab page.
- Dragging Link Groups, SavedLinks, and Todos updates their persisted order.
- Local tabs, links, and todos work without login.

## Permissions

The MVP uses:

- `tabs`
- `storage`
- `favicon`

Cloudflare KV uses an optional host permission, requested at runtime:

- `https://api.cloudflare.com/*`

Do not add more Chrome permissions unless a task explicitly requires them.

## License

[MIT](../../LICENSE)
