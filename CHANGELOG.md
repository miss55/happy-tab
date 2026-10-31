# Changelog

Notable changes to the Tabvia extension. The version matches `apps/extension`
and `apps/extension/public/manifest.json`.

## [0.2.5] - 2026-10-31

### Added

- Bookmark pages organize link groups into separate workspaces. Create, rename, reorder, and remove empty pages, and move groups or links between pages from their edit controls.
- Local migration keeps existing groups and links on the default page. Version 2 backups and optional sync snapshots include pages while still accepting version 1 data.
- New store screenshots and editable sources cover English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, French, and German.

### Changed

- The bookmark toolbar shows page tabs and the current page's link count. Quick navigation, open browser tabs, and the optional todo list remain shared across pages.

## [0.2.4] - 2026-10-25

### Added

- Dragging a bookmark, group, or open tab near the top or bottom of the saved-links column scrolls that column. The drop preview follows rows that move under a stationary pointer.

### Fixed

- The add-link panel stays above bookmark cards. A glass header no longer covers the group picker.

## [0.2.3] - 2026-10-24

### Changed

- Refreshing shortcuts, todos, and open tabs no longer flashes the workspace loading banner. An empty list stays on the empty state.
- Theme gallery cards show recommended style examples. Soft, Minimal, Glass, and Fluent stay light; OLED and Cyber stay dark. They do not follow the current accent, background, or effects.
- A selected theme option uses one accent border and a check mark. Arrow keys, Home, and End move through the style list, with a separate keyboard focus outline.
- A saved custom image says whether it is in use. Switching background type keeps the image, and the blur slider stays disabled while blur is off.
- The system reduced-motion preference turns off CSS animations and transitions.

## [0.2.2] - 2026-10-22

### Changed

- Dragging a bookmark or shortcut slides neighbours into a stable gap, so the drop target does not flicker. Groups stay in their masonry columns while a drop target grows.
- Dialogs close without flashing their blur.
- Link group headers keep the saved color and change how strong it looks in each theme. Soft stays bright; Minimal and Fluent use a light tint; dark Glass, OLED, and Cyber use a darker tint with light text.
- Theme previews show miniature group headers, site icons, and link text. OLED and Cyber previews stay dark.
- Cyber keeps ordinary panels quiet and uses its glow on dialogs and keyboard focus. Fluent shadows are quieter, and Glass shows more of the wallpaper.
- Navigation shortcut names skip English articles and regional host prefixes, and take a Chinese brand from the text before its slogan.

## [0.2.1] - 2026-10-20

### Added

- Dragging a saved link shows the insertion slot, and groups and links animate into their new positions.
- Cloud sync confirms when settings are saved, and stops without uploading when the end-to-end password cannot decrypt the remote snapshot.

### Changed

- Bookmark order updates on screen immediately. A later refresh does not flash the loading state when groups are already visible.
- The open-tab list keeps windows that have not changed.
- Site icons are remembered for the exact icon candidate list, with a larger in-memory cache.
- Custom accent text stays readable on the surface and soft accent backgrounds. Filled buttons use separate ink for the normal and hover fills.
- Turning blur off also turns off wallpaper and panel blur. The blur slider can reach 0 in every style.
- OLED and Cyber say that they always use dark mode, and keep the saved color mode for other styles.
- With a wallpaper, the OLED bookmarks header uses a solid surface, as Soft and Minimal already do.
- A new sync setup starts on Upstash Redis. Provider lists in the UI follow that order. Sync stays off until the user turns it on.

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
