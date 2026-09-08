# HappyTab Agent Instructions

You are working on HappyTab, a pnpm workspace whose product is a Chrome Manifest V3 extension.

HappyTab replaces the browser new tab page. It shows current browser tabs grouped by Chrome windows, allows users to save tabs as custom links, organize links into draggable groups, track link open counts, manage a local todo list, and optionally sync a snapshot to user-owned third-party storage.

## Repository Structure

- apps/extension: Chrome extension built with Vue 3, TypeScript, Vite, Pinia, Dexie, and Manifest V3.
- docs: Product and architecture documents.

## Core Principles

1. Local-first architecture.
2. Cloud sync is optional and must be explicitly enabled by the user.
3. The extension must work without login.
4. Do not upload user private data unless sync is enabled.
5. Sync targets are user-owned third-party stores (JSONBin, GitHub Gist, Cloudflare KV, Upstash Redis, or a custom REST endpoint).
6. Use soft delete with deleted_at for syncable entities.
7. Use stable UUIDs for syncable entities.
8. Keep Chrome permissions minimal.
9. Prefer simple, maintainable code over over-engineered abstractions.

## Terminology

- Browser Tab: A currently opened Chrome tab from chrome.tabs API.
- Link: A saved user bookmark-like item managed by HappyTab.
- Link Group: A user-defined group containing saved Links.
- Todo: A user-created task item.

Never confuse Browser Tab with Link.

## Chrome Extension Requirements

Use Manifest V3.

The extension must override the Chrome new tab page.

Use minimal permissions:

- tabs
- storage
- favicon

Cloudflare KV uses `optional_host_permissions` for `https://api.cloudflare.com/*`.
Request it at runtime when the user tests or syncs that provider. Do not put it
in install-time `host_permissions`.

Only add more permissions when a task explicitly requires them.

Use IndexedDB through Dexie for business data:

- link groups
- links
- todos
- usage stats
- sync queue

Use chrome.storage.local only for lightweight settings:

- sync enabled flag and provider credentials
- theme settings
- last sync time
- language preference

## Coding Rules

- Use TypeScript in frontend projects.
- Use Composition API in Vue.
- Use Pinia for app state.
- Keep modules domain-oriented.
- Do not put all logic in components.
- Add basic error handling.
- Add README instructions when adding a new app or service.
- After making changes, run available build, lint, or typecheck commands.
- If a command fails because dependencies are missing, explain the reason and the next command needed.

## Do Not Do Yet

- First-party backend or login
- Server-defined preset groups or preset links
- Chrome native bookmarks sync
- browser history analysis
- CRDT
- multi-tenant team workspace
- AI recommendation
- advanced analytics
- payment system
