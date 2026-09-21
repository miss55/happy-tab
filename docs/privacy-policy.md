# HappyTab Privacy Policy

Public HTML copy for store listings and GitHub Pages:

- In-extension page: `apps/extension/public/privacy.html` (also copied into the built package)
- Hostable copy: [privacy-policy.html](./privacy-policy.html)
- Public HTTPS URL (GitHub Pages): [https://miss55.github.io/happy-tab/privacy-policy.html](https://miss55.github.io/happy-tab/privacy-policy.html)

Chrome Web Store and Microsoft Edge Add-ons both need that **public HTTPS URL**. Enable Pages for `docs/` on `main` if the URL is not live yet, then paste it into both developer dashboards.

The policy states:

- HappyTab is a bookmark manager that replaces the new tab page. It does not
  read, replace, or sync the browser’s built-in bookmarks.
- HappyTab has no first-party backend and does not collect user data.
- `tabs` is used only for currently open tabs (title and URL), shown locally and saved locally if the user chooses.
- Sync is opt-in and goes only to storage the user configures. Snapshots include bookmarks, todos, and usage stats (including locally deleted records for cross-device consistency). They do not include open tabs, wallpaper, theme, credentials, or browser identity.
- Custom REST sync requires HTTPS.
- Users can export a backup, delete items, or replace local business data by importing a backup. Uninstalling clears local extension storage.
- Cloudflare host access is requested at use time, not at install time.
