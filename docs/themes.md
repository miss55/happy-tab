# Themes

Tabvia uses a Theme Engine. Style, color mode, accent palette, and
background are independent. Switching a theme does not copy pages or change
bookmark, todo, or tab behavior.

## Style

The style is the design language:

- `soft`: the default Tabvia look, with rounded cards and soft shadows;
- `minimal`: flat surfaces, visible 1px borders, and almost no shadow;
- `glass`: frosted surfaces over a wallpaper or atmospheric gradient;
- `fluent`: mica-inspired translucent layers and medium rounding;
- `oled`: true black backgrounds and high-contrast surfaces, always dark;
- `cyber`: neon edges with a restrained glow.

Layout stays the same. Style tokens change radius, border, shadow,
transparency, blur, and glow. They do not change the sidebar, bookmark grid,
or control spacing.

Glass uses a shared 16px outer radius for the navigation dock, bookmarks header,
and bookmark groups. Navigation tiles use 10px; colored group headers follow the
16px upper corners and meet the content with square lower corners. Dialogs keep
their separate large-radius token.

## Mode, palette, and background

Mode is `system`, `light`, or `dark`. OLED and Cyber always resolve to dark.

Palette only changes the accent color used for selection, focus, hover
emphasis, and primary actions. The default is `style`, which uses each
style’s own accent (Soft blue, Minimal indigo, Glass violet, Fluent
Windows blue, OLED sky, Cyber cyan). Named palettes (`blue`, `purple`,
`green`, `orange`) and a custom hex accent override that until the user
picks Follow style again. Bookmark titles, todo titles, and body copy use
the surface text color so they stay readable in every style.

Background is independent from style:

- `solid`
- `gradient`
- `wallpaper` (bundled local WebP images: Morning Lake, Aurora Forest, Coral
  Flow, Lavender Sky)
- `custom-image` (a PNG, JPEG, or WebP file up to 5 MB, stored in IndexedDB)

Glass and Fluent work with a solid color or a wallpaper. Soft and Minimal can
also use a wallpaper without becoming Glass.

Effects can turn blur, animation, and glow off without changing the style.
Turning blur off disables both the wallpaper filter and panel/toolbar blur.
The custom background blur slider is respected down to 0px in every style;
Glass and Fluent do not impose a minimum background blur.
OLED and Cyber show their fixed dark mode in the picker and preserve the user's
mode preference for the next style that supports it.

## Storage

Theme settings are stored in `chrome.storage.local` under `happy_tab_theme`.
They are excluded from local data backups and are never uploaded. Older
preset-based settings are migrated on load: `refined` becomes `soft`, and
wallpaper presets become Glass plus the matching bundled wallpaper.

The bundled wallpapers are original local WebP assets and require no network
or host permissions.

## Tokens

Components consume semantic CSS variables such as `--theme-surface`,
`--theme-text`, `--theme-border`, `--theme-accent`, `--theme-radius-lg`, and
`--theme-card-shadow`. Style-specific values are applied through
`data-theme-style` on the document root. Palette values are applied through
`data-theme-palette`.
Theme tokens live in `src/styles/theme-tokens.css`; component and interaction
rules remain in `src/styles.css`. Accent text uses `--theme-accent-text`, while
filled buttons use separate normal and hover ink tokens. Custom accents keep
the user's fill color and adjust emphasis text for at least 4.5:1 contrast on
the style's base and accent-soft surfaces. Light green, orange, and Glass violet
fills use darker shades for readable white button text.
Group depth consumes `--theme-group-shadow`, so Soft retains its soft shadow,
Minimal and OLED retain flat surfaces, and Cyber follows the chosen accent for
its optional glow. The selected group has an accent-colored body outline.
Fluent uses denser layers, quieter shadows, and subtler highlights than Glass
in both modes. Glass retains more wallpaper color through its surfaces. Cyber
keeps ordinary panels quiet and reserves its restrained glow for dialogs and
keyboard focus. Gallery previews show miniature group headers, site icons, and
link text in the resolved mode; OLED and Cyber always preview dark.

Link groups share the current theme's surface, transparency, and blur instead
of using a fixed glass material. Their headers preserve the saved hue and shade
while adapting visual weight to the style. Soft keeps bright pastel bars; Minimal and Fluent use restrained
tints; dark Glass, OLED, and Cyber use darker tinted headers with light text.
Header fills remain opaque for reliable contrast over wallpaper. The color
picker previews the same adapted fill without changing saved palette indexes.
Glass and Fluent use denser dark surfaces to preserve legibility over bright
wallpaper; turning blur off still uses the theme's effect settings.

Automatic group colors first cover the ten hue families, then use shade
variants. Allocation compares accent colors in OKLab and favors separation
from nearby groups when colors must repeat. Existing saved palette indexes
and manually selected colors remain unchanged. The picker shows the ten base
colors first, with the remaining shades in an expandable section.
The palette uses saturated base hues and five pastel strengths, including
clear yellow, cyan, blue, and lime instead of gray and muted earth tones.
Existing palette indexes remain valid, but
their displayed colors follow the revised palette. In a group's editor,
"Choose a distinct color" previews a new color against the other groups;
Save persists it and Cancel discards the preview.

Favicons have a small light neutral backing so transparent dark artwork remains
visible on dark themes. This does not modify image files or add network requests.

Quick navigation entries use opaque theme-based tiles with visible borders and
primary surface text, including the Add entry. Hover and keyboard focus use the
theme accent. The enclosing dock can retain its glass material without making
individual shortcuts depend on wallpaper contrast. Icon fallback letters use
dark ink on their light backing in every mode.

Remote themes, arbitrary CSS, and theme synchronization remain outside the
feature boundary.

## Header readability over wallpapers

With wallpaper or a custom background image enabled, Soft, Minimal, and OLED give the
bookmarks header a solid theme surface so the title and link-count hint remain
readable over either bright or dark artwork. Plain backgrounds keep the simple
unboxed header; glass styles retain their own material treatment.

## Refresh and first paint

The local, parser-blocking `theme-boot.js` restores a disposable paint hint
before the Vue bundle runs. It contains only resolved appearance values and an
optional packaged wallpaper path; Chrome storage remains the authoritative
settings store. Missing, invalid, or inaccessible hints fall back to the system
color scheme. System-mode hints are checked against the current system scheme.
Custom image blobs and object URLs are never copied to this cache.

The fixed background layer lives outside Vue. Theme colors are applied before
waiting for the IndexedDB background asset, and the initial wallpaper is
preloaded/decoded with a bounded wait. The app becomes visible after local core
data and the first masonry layout settle; favicon loading and cloud sync do not
delay that reveal. Startup transitions are disabled until that point.

## Verification

Run `pnpm check:themes` from the repository root with dependencies installed.
It starts a temporary local Vite server and a headless Chrome/Chromium instance
with a disposable profile. Set `CHROME_PATH` when the browser is not in a common
installation location. The runner requires Node.js 22 or newer for WebSocket.
It checks the real Vue mode controls, final computed colors, wallpaper title
protection, disabled blur, group selection, and style/palette transitions.
The HTML harness in `apps/extension/tests/theme-styles.html` is not a production
build entry and is not included in the extension package.
