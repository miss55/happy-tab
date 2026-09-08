# Themes

HappyTab uses a Theme Engine. Style, color mode, accent palette, and
background are independent. Switching a theme does not copy pages or change
bookmark, todo, or tab behavior.

## Style

The style is the design language:

- `soft`: the default HappyTab look, with rounded cards and soft shadows;
- `minimal`: flat surfaces, visible 1px borders, and almost no shadow;
- `glass`: frosted surfaces over a wallpaper or atmospheric gradient;
- `fluent`: mica-inspired translucent layers and medium rounding;
- `oled`: true black backgrounds and high-contrast surfaces, always dark;
- `cyber`: neon edges with a restrained glow.

Layout stays the same. Style tokens change radius, border, shadow,
transparency, blur, and glow. They do not change the sidebar, bookmark grid,
or control spacing.

## Mode, palette, and background

Mode is `system`, `light`, or `dark`. OLED always resolves to dark.

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

Remote themes, arbitrary CSS, and theme synchronization remain outside the
feature boundary.
