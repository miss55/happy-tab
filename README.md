# HappyTab

HappyTab is a bookmark manager that replaces the browser new tab page.

Save and group links locally, import or export a JSON backup, or optionally sync a snapshot to storage you already own. The extension is local-first: no login and no first-party backend. The UI is available in English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, French, and German.

This repository is a pnpm workspace. The product is the Manifest V3 extension in `apps/extension`. Cloud sync uses user-owned third-party storage; there is no first-party backend. HappyTab bookmarks live on the new tab page and do not replace the browser’s built-in bookmark bar.

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
- Save current Browser Tabs as SavedLinks by button or by dragging them onto a Link Group.
- Manually add SavedLinks by URL.
- Open SavedLinks in a new tab while updating `open_count` and `last_opened_at`.
- Drag-sort SavedLinks within a group and between groups.
- Local TodoList stored in IndexedDB.
- Create, complete/uncomplete, edit, delete, and drag-sort Todos by `sort_order`.
- Local business data writes go through repository layers before Dexie.
- English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, French, and German extension UI with browser-language detection and a locally persisted language preference.
- Versioned JSON export and validated merge/replace import for local Link, Todo, and usage data.
- System, light, dark, and custom-color extension themes persisted locally.
- Optional snapshot sync to JSONBin, GitHub Gist, Cloudflare KV, Upstash Redis, or a custom REST endpoint.

Incomplete or awaiting verification:

- Broader automated coverage beyond the current IndexedDB and sync unit tests.
- Full unpacked-extension regression pass in Chrome and Edge.
- Chrome native bookmarks sync.

## License

[MIT](./LICENSE)
