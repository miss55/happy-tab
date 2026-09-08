# HappyTab Roadmap

## Phase 1: Local Extension MVP

Status: behavior implemented; stabilization and browser validation remain.

Done:

- Initialize pnpm workspace.
- Create Chrome Manifest V3 extension skeleton.
- Override Chrome new tab page.
- Read current Chrome windows and Browser Tabs.
- Display Browser Tabs grouped by window.
- Switch to a Browser Tab.
- Close a Browser Tab.
- Create Link Groups.
- Save Browser Tabs as Links.
- Manually add custom Links.
- Edit and soft-delete Link Groups and Links.
- Drag-sort Link Groups and Links.
- Track Link `open_count` and `last_opened_at`.
- Implement local TodoList.
- Drag-sort Todos.
- Persist local MVP data in IndexedDB through Dexie.
- Preserve v1/v2 Link Groups when migrating to the current Dexie schema.

Remaining local MVP polish:

- Review keyboard accessibility for drag sorting.
- Improve empty/loading/error states.
- Consider splitting large Vue page into smaller domain components.
- Expand tests beyond the current database migration coverage.
- Complete a manual Chrome unpacked-extension regression pass.

## Phase 2: Optional Third-Party Sync

Status: implemented for user-owned storage providers.

Done:

- Opt-in snapshot sync UI.
- JSONBin, GitHub Gist, Cloudflare KV, Upstash Redis, and custom REST providers.
- Optional AES-256-GCM encryption before upload.
- Last-write-wins merge on item `updated_at`.

Remaining:

- Broader cross-device integration tests.
- Retry and last-sync cursor polish where still incomplete.

## Explicitly Out of Scope

- First-party backend or login.
- Server-defined preset groups and preset links.
- Chrome native bookmarks sync.
- Browser history analysis.
- CRDT.
- Multi-tenant team workspace.
- AI recommendation.
- Advanced analytics.
- Payment system.
