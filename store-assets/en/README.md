# English store screenshots

Upload these five **1280 × 800 PNGs**, in this order:

1. `01-workspace.png` — Bookmark workspace on the new tab page.
2. `02-drag-to-save.png` — Drag an open browser tab into a bookmark group.
3. `03-themes.png` — The same groups in Soft / Light, Soft / Dark, and Glass / Light.
4. `04-local-and-backup.png` — Local data, no account required, JSON import/export.
5. `05-optional-sync.png` — Optional sync to user-owned third-party storage.

The original `i18n.png`, `local-storage.png`, `sync.png`, and `theme.png` are
preserved. Language support is now a supporting message on the first image.

## Review and edit

- `source/contact-sheet.png` — All five images at half size for visual review.
- `source/contact-sheet.html` — Open locally to review the PNGs together.
- `source/01-*.html` through `source/05-*.html` — Editable layouts with local image references.
- `source/captures/` — Actual Vue UI captures used in the layouts.
- `source/manifest.json` — Upload order, dimensions, provenance, and original-image SHA-256 hashes.

The UI screenshots come from the current working tree, using fictional sample
records in a disposable Chromium profile. Sample favicons are local initial-letter
icons. The drag image uses the app's real drag state plus an editorial arrow.
Cloud sync remains disabled; no credentials, user browser data, or provider
requests are used. No application source files are changed by the generator.

## Regenerate

From the repository root, with dependencies installed and Node.js 22+:

```powershell
node store-assets/en/source/generate.mjs
```

The script finds Chrome or Edge on Windows. Set `CHROME_PATH` for another Chromium
installation. It starts a local Vite server, captures the real app, and renders
the five layouts. It verifies that all four original PNG hashes stay unchanged.

Edit headlines and composition in `source/generate.mjs` to retain changes across
regeneration. For a layout-only adjustment, the generated HTML files can also be
edited directly. Regenerate with the release source when the product UI changes.
