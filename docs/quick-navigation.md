# Quick navigation

The dock opens shortcuts normally. Manage switches the same cards into an
editing mode: drag cards to reorder, click a card to edit, or use its remove
button. Done or Escape leaves management mode. Alt + Left/Right retains keyboard
reordering. Moving or removing a shortcut saves immediately to local IndexedDB.
Management instructions replace the count in the existing single-line header,
so entering management does not insert a row or change the dock height.

Add is visible only in management mode and opens a separate compact form, with URL first and display name second.
Existing browser tabs and saved links supply a short name and icon when their
URL matches; otherwise the hostname and normal favicon fallback are used.
All site icons reserve their dimensions and show a hostname initial while
unavailable. Known site icon URLs are preloaded before a short fade-in, with
in-flight requests shared and successful icons reused by origin in a bounded
in-memory cache. Live browser tabs wait for their own favicon URL rather than
displaying Chrome's temporary default globe. Tab URL, title, and favicon updates
patch the visible row without refreshing or reordering the list.
Editing the suggested name prevents further URL edits from overwriting it.
Custom icon URLs live in the collapsed More settings section. Cancel discards
form edits. The dialog traps keyboard focus and restores it on closing.

Removal asks for confirmation before soft deletion. Cancel is focused first;
Tab stays inside the confirmation dialog and Escape cancels. The dock offers Undo for the latest removed item,
and repeated Undo can recover earlier removals during the current page session.
Restoration retains the original UUID and icon and places the item by its saved
sort order. If the URL has been added again, restoration reports the duplicate
instead of creating two active shortcuts. Undo appears in a single floating
notice at the bottom of the viewport, without changing dock or bookmark layout.
It hides after ten seconds, restarting that interval after pointer hover,
keyboard focus, or an ongoing operation ends. Further removals update the same
notice; repeated Undo restores earlier removals while the notice is visible.
Failed restores retain the action for retry.

No new permissions or remote metadata requests are introduced. Navigation
shortcuts stay separate from the browser bookmark bar. They are stored locally
and travel with the JSON backup and the optional snapshot sync.

## Drag preview

The navigation dock appears above the bookmarks header. The Add bookmark
control belongs to that header and stays aligned with it at every viewport size.

When shortcuts overflow horizontally, vertical mouse-wheel input scrolls the
dock sideways throughout the navigation area, including its header. At either
end, the gesture stays within the dock without scrolling the surrounding column.
Horizontal trackpad gestures also remain within the dock; browser zoom is preserved.
The saved-links column hides its vertical scrollbar while retaining scrolling.

Dragging an open browser tab or saved link over the dock switches the floating
preview to the same icon card and short name as a navigation shortcut. Leaving
the dock restores the source row preview. The preview ignores pointer events
and clears on drop or cancellation; existing add, sorting, and duplicate URL
validation continue to use native drag events.

