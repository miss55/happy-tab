# Tabvia

**English** | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md)

Tabvia is a bookmark manager that replaces the browser new tab page. The extension version is 0.2.5. See [CHANGELOG.md](./CHANGELOG.md).

Save and group links locally, import or export a JSON backup, or optionally sync a snapshot to storage you already own. The extension is local-first: no login and no first-party backend. The UI is available in English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, French, and German.

This repository is a pnpm workspace. The product is the Manifest V3 extension in `apps/extension`. Cloud sync uses user-owned third-party storage; there is no first-party backend. Tabvia bookmarks live on the new tab page and do not replace the browser’s built-in bookmark bar.

- Source: [https://github.com/miss55/happy-tab](https://github.com/miss55/happy-tab)
- Issues: [https://github.com/miss55/happy-tab/issues](https://github.com/miss55/happy-tab/issues)
- Privacy policy: [https://miss55.github.io/happy-tab/privacy-policy.html](https://miss55.github.io/happy-tab/privacy-policy.html)

## Structure

- `apps/extension`: Chrome MV3 extension built with Vite, Vue 3, and TypeScript.
- `docs`: Product and architecture documentation.

## Development

Install dependencies:

```sh
pnpm install
```

Run the extension dev server:

```sh
pnpm dev:extension
```

Validate the extension manifest:

```sh
pnpm check:manifest
```

Run frontend tests:

```sh
pnpm test
```

Build the extension:

```sh
pnpm build:extension
```

Load `apps/extension/dist` as an unpacked extension in Chrome (`chrome://extensions`) or Edge (`edge://extensions`).

See [docs/store-listing.md](./docs/store-listing.md) for Chrome Web Store and Microsoft Edge Add-ons packaging, and [docs/privacy-policy.md](./docs/privacy-policy.md) for the privacy policy that those stores require. After GitHub Pages is enabled for `docs/`, paste `https://miss55.github.io/happy-tab/privacy-policy.html` into both store dashboards.

## Current Status

The local new tab MVP and optional third-party cloud snapshot sync are implemented.

Implemented:

- Chrome MV3 new tab override (also works in Microsoft Edge).
- Browser Tabs grouped by Chrome window.
- Browser Tab switching and closing.
- Local Link Groups and SavedLinks stored in IndexedDB.
- Create, rename, delete, and drag-sort Link Groups.
- Organize Link Groups into bookmark pages. Create, rename, reorder, and delete empty pages, and move groups or links between pages from their edit controls. Quick navigation, Browser Tabs, and the optional todo list remain shared.
- Save current Browser Tabs as SavedLinks by button or by dragging them onto a Link Group.
- Manually add SavedLinks by URL.
- Open SavedLinks in a new tab while updating `open_count` and `last_opened_at`.
- Drag-sort SavedLinks within a group and between groups.
- Local TodoList stored in IndexedDB.
- Create, complete/uncomplete, edit, delete, and drag-sort Todos by `sort_order`.
- The todo list is hidden by default and can be enabled in Import / Export.
- Local business data writes go through repository layers before Dexie.
- English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, French, and German extension UI with browser-language detection and a locally persisted language preference.
- Versioned JSON export and validated merge/replace import for bookmark pages, Link Groups, Links, Todos, usage stats, and quick-nav shortcuts. Version 2 backups preserve page membership; version 1 backups remain supported.
- Theme styles (soft, minimal, glass, fluent, oled, cyber), light/dark/system mode, accent palettes, bundled wallpapers, and a local custom background. The saved appearance is painted before the app bundle loads.
- Quick navigation dock above the bookmarks. Add a shortcut by URL, or by dragging a browser tab or saved link onto the dock. Reorder, edit, and remove shortcuts locally, and undo a removal during the current page session.
- Link groups laid out in a masonry grid, with distinct pastel header colors assigned automatically and adjustable per group.
- Optional snapshot sync to Upstash Redis, GitHub Gist, Cloudflare KV, JSONBin, or a custom REST endpoint. Bookmark pages and quick-nav shortcuts are included in that snapshot.

Update all syncing devices before using multiple bookmark pages: older clients cannot preserve page collections. See [Bookmark pages](./docs/bookmark-pages.md) for migration, backup, and sync compatibility.

Incomplete or awaiting verification:

- Broader automated coverage beyond the current unit tests and bookmark-page/theme browser checks.
- Full unpacked-extension regression pass in Chrome and Edge.

Chrome native bookmarks sync is outside the current scope.

## Documentation languages

Use the language links at the top of this page to read this README in any of the eight UI languages. The extension development guide, changelog, and detailed documents under `docs/` are currently in English.

## License

[MIT](./LICENSE)
