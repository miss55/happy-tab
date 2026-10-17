# Tabvia Extension

Manifest V3 new tab bookmark manager built with Vite, Vue 3, TypeScript, Pinia, and Dexie. The same package loads in Google Chrome and Microsoft Edge. The UI is available in 8 languages. Tabvia stores its own bookmark groups; it does not replace the browser bookmark bar.

Source: [https://github.com/miss55/happy-tab](https://github.com/miss55/happy-tab)

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
- Hides the todo list by default; it can be turned on in Import / Export.
- Persists Todo `sort_order`.
- Persists business data in IndexedDB through Dexie.
- Supports English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, French, and German UI; initially follows the browser language, and remembers manual language changes locally.
- Exports active local business data to a versioned JSON backup.
- Imports validated Tabvia backups in safe merge mode or confirmed replace mode.
- Supports theme styles (soft, minimal, glass, fluent, oled, cyber), light/dark/system mode, accent palettes, bundled wallpapers, and a local custom background. Settings stay in local extension storage. A local boot script paints the saved appearance before the app bundle loads.
- Pins sites in a quick-navigation dock above the bookmarks. Shortcuts can be added by URL or by dragging a browser tab or saved link onto the dock, then reordered, edited, or removed. A removal can be undone during the current page session.
- Lays link groups out in a masonry grid and gives each group a pastel header color. Colors are assigned automatically and can be changed per group.
- Includes active quick-nav shortcuts in the JSON backup and the optional snapshot sync. Backups written before quick nav omit `nav_shortcuts` and still import.

## Cloud Storage Sync

The extension works 100% local-first and offline without requiring a custom server backend.

Tabvia supports syncing your data snapshot to third-party cloud storage:

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
pnpm --filter @tabvia/extension test
```

The current Dexie schema is version 6, which adds `nav_shortcuts`. The migration
suite verifies fresh installs and upgrades from database versions 1, 2, and 3.

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
- Exporting local data downloads a `tabvia-backup-YYYY-MM-DD.json` file.
- Merge import keeps unrelated local records; replace import requires confirmation and restores only the backup.
- Invalid, unsupported, oversized, unsafe, or internally inconsistent backups do not change local data.
- Theme changes apply immediately, survive refresh, and can be reset to system mode. A refresh keeps the saved appearance on the first paint.
- Dragging a browser tab or saved link onto the quick-nav dock saves it as a shortcut. Managing the dock reorders, edits, and removes shortcuts without changing the dock height.
- Link groups keep a masonry layout after refresh, and each group header keeps its saved color.
- Clicking a Browser Tab switches to it.
- Closing a Browser Tab removes it from Chrome and the list.
- Saved Links persist after refreshing the new tab page.
- Todos stay hidden until enabled in Import / Export, then persist after refresh.
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
