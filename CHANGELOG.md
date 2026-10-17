# Changelog

Notable changes to the Tabvia extension. The version matches `apps/extension`
and `apps/extension/public/manifest.json`.

## [0.2.0] - 2026-10-17

### Added

- Quick navigation dock above the bookmarks. Add a shortcut by URL, or by dragging an open browser tab or a saved link onto the dock.
- Management mode for the dock: drag to reorder, click a card to edit, remove with confirmation, and reorder with Alt + Left/Right. Entering management does not change the dock height.
- Undo for a removed shortcut during the current page session. Undo keeps the original id and icon, and reports a duplicate if that URL was added again.
- Horizontal scrolling for an overflowing dock, including vertical mouse-wheel input over the dock.
- Masonry layout for link groups.
- Pastel link-group header colors. Colors are assigned automatically for separation, and each group can pick its own color.
- First-paint theme restore. A local boot script applies the saved appearance before the Vue bundle runs. Custom background images stay in IndexedDB and are not copied into that hint.
- Hostname-initial icon fallback, reserved icon space, and a short fade-in after a site icon is ready. Open browser tabs wait for their own icon instead of showing the temporary default globe.

### Changed

- JSON backup and optional snapshot sync include active quick-nav shortcuts. Older backups and snapshots that omit `nav_shortcuts` still import; replace import treats a missing list as empty.
- Link groups follow the current theme surface. Headers stay bright and opaque in light and dark mode.
- With a wallpaper or custom background, Soft and Minimal give the bookmarks header a solid surface so the title stays readable.
- OLED and Cyber always use the dark color scheme.
- Favicons sit on a small light backing so dark artwork stays visible on dark themes.

## [0.1.3] - 2026-10-11

### Changed

- Renamed the product from HappyTab to Tabvia. Stored data keeps the existing database and setting keys.
- Presented the new tab as a bookmark manager, and hid the todo list until it is turned on in Import / Export.
- Replaced store artwork with Tabvia promos and fitted screenshots to the 1280×800 listing size.

## [0.1.2] - 2026-09-08

### Added

- Initial local-first Manifest V3 new tab extension: browser tabs grouped by window, saved link groups, todos, eight-language UI, versioned JSON backup, local themes, and optional snapshot sync to user-owned storage.
