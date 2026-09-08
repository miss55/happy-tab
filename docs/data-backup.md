# Local Data Backup

HappyTab exports local business data as a versioned JSON document. The current
format is `happy-tab-backup` version `1`.

## Included data

- active Link Groups;
- active Links whose Link Group is included;
- active Todos;
- active Usage Stats whose Link is included.

The export deliberately excludes authentication tokens, extension settings,
the local theme background image, soft-deleted records, and sync queue items.
This keeps the JSON backup bounded and prevents a device-specific image from
silently increasing its size.

## Format

```json
{
  "format": "happy-tab-backup",
  "version": 1,
  "exported_at": "2026-07-30T00:00:00.000Z",
  "data": {
    "link_groups": [],
    "links": [],
    "todos": [],
    "usage_stats": []
  }
}
```

Entity fields use the same names and stable UUIDs as the IndexedDB records.
Import accepts only the currently supported version and HTTP/HTTPS Link URLs.
IDs must be unique within each entity collection, every Link must reference an
included Link Group, and every Usage Stat must reference an included Link.

## Import modes

### Merge

Merge is the default. Imported records replace local records with the same ID.
Other local records remain. Sort orders are normalized after the transaction.
Pending sync queue entries for imported IDs are removed so an old payload cannot
later overwrite the imported value; unrelated queue entries remain.

### Replace

Replace clears the four included business-data tables before restoring the
backup. It also clears the local sync queue so stale operations cannot act on
the restored data. The UI requires explicit confirmation.

Both modes validate and sanitize the complete file before opening a write
transaction. A validation failure does not partially import data.

## Compatibility

Future incompatible formats must increment `version` and add an explicit
parser or migration. Unknown versions are rejected instead of being guessed.
