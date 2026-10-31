# Bookmark pages

Bookmark pages add one level above Link Groups: **Page → Link Group → Link**.
They are independent of Chrome Browser Tabs. The browser-tab sidebar, quick nav,
and the optional shared todo list stay global.

## Usage

- The bookmark toolbar is a single row of page names and `+`. The initial page
  is named Bookmarks; there is no separate heading above the pages. A summary
  below the tabs shows the current page's link count and local storage status.
  Only the current page's groups and links are rendered. Tab widths stay stable
  when switching pages or revealing the management button.
- Use `+` to create a page. Hover or focus the selected page to reveal `…`
  (always visible on touch devices), or right-click a page, to rename it or move it left
  or right. Page tabs also support dragging to reorder, and arrow/Home/End keys
  switch pages when the tab strip has focus.
- Edit a group and choose its destination page to move the whole group. Its
  links, UUIDs, colors and open statistics are retained. The moved group is
  appended to the destination page.
- Edit a link and select a group under the destination page's name to move that
  link. It is appended to the destination group. Create a group on an empty
  destination page first if necessary.
- Existing within-page group/link dragging and dragging Browser Tabs into
  groups continue to work. Switch pages before starting a drag. Cross-page
  moves use the edit controls in this release.
- A page must contain no active groups before it can be deleted, even if its
  groups contain no links. Deletion requires confirmation and uses a tombstone.
  The default page remains available for legacy data and cannot be deleted.
- A new page starts empty. Adding a bookmark directly or saving a Browser Tab
  on an empty page creates a local `Saved Links` group on that page.

## Local storage and migration

Dexie schema version 7 adds `bookmark_pages` and indexes `link_groups.page_id`.
Each existing group, including soft-deleted groups, gets the shared default-page
UUID `00000000-0000-4000-8000-000000000001`. No group/link UUID, link order,
existing timestamps, open counts, or tombstones are reset by the migration.
New pages use random UUIDs. Group order is scoped to its page; link order remains
scoped to its group.

The default page's initially empty stored name is displayed using the current
language. Users can rename it. The last selected page is a device preference
stored under `happy_tab_active_bookmark_page` in `chrome.storage.local` and is
excluded from backups and sync. Missing/deleted selections fall back to Default.

## Backup and sync compatibility

Backup version 2 includes active `bookmark_pages` and each group's `page_id`.
Both merge and replace import validate all page/group/link relationships before
writing. Version 1 backups remain supported and are migrated into Default.
Merging a legacy backup does not reset the local default page's custom name.
Versions newer than supported are rejected.

Sync snapshot version 2 includes pages and their soft-delete records. All five
providers use the same snapshot/merge rules. Version 1 snapshots remain readable;
groups without ownership go to Default, while a newer legacy group edit preserves
ownership already known on this device. Missing page collections do not delete
locally known pages. If deletion of an empty page races with another device moving
a group into it, the group is retained in Default instead of becoming hidden.
Unsupported or malformed versioned snapshots fail before local application or
upload.

Update Tabvia on all syncing devices before using multiple pages. Older clients
do not understand page collections and can omit them when uploading; compatibility
with their existing data cannot make those clients preserve the new structure.
Keep a version 2 backup when moving between extension versions.

No new browser permissions, account, backend, or automatic cloud opt-in is added.

## Verification

`pnpm test`, `pnpm typecheck`, and `pnpm build` cover the application and migration
logic. `pnpm check:pages` runs page interactions and existing
drag behavior in headless Chrome/Edge with a disposable profile. Set `CHROME_PATH`
if the browser is installed outside the usual locations.
