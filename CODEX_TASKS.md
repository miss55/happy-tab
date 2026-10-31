# Tabvia Project Instructions

We are building Tabvia, a Chrome Manifest V3 extension that replaces the browser new tab page. It shows current browser tabs grouped by Chrome windows, allows users to save tabs as custom links, organize links into draggable groups, track link open counts, manage a local todo list, and optionally sync a snapshot to user-owned third-party storage.

The workspace contains:

- apps/extension: Chrome extension built with Vue 3, TypeScript, Vite, Pinia, IndexedDB/Dexie.
- docs: product and architecture documents.

Do not add a first-party API or backend.

Core principles:

1. Local-first.
2. Cloud sync is optional and must be explicitly enabled by the user.
3. The extension must work without login.
4. Sync uses user-owned third-party storage, not a Tabvia server.
5. Use soft delete with deleted_at for syncable entities.
6. Use stable UUIDs for entities.
7. Keep Chrome permissions minimal.
