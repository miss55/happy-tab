# Store listing and packaging

HappyTab uses one Manifest V3 package for Chrome and Microsoft Edge. Zip the
contents of `apps/extension/dist` (so `manifest.json` is at the zip root), not
the `dist` folder itself.

## GitHub and privacy policy URL

- Source: [https://github.com/miss55/happy-tab](https://github.com/miss55/happy-tab)
- Privacy policy (GitHub Pages):
  [https://miss55.github.io/happy-tab/privacy-policy.html](https://miss55.github.io/happy-tab/privacy-policy.html)

Enable Pages once: GitHub → Settings → Pages → Build and deployment → Deploy
from a branch → `main` → `/docs`. Wait until the privacy URL returns HTTP 200.

Then:

1. Paste that live privacy URL into Chrome Web Store and Edge Add-ons.
2. Load unpacked `apps/extension/dist` in Chrome and Edge, then capture real
   **1280×800** (or Edge 640×480) new-tab screenshots. Do not use mockups.
3. Fill each store listing separately. Edge text must not sell HappyTab as a
   Chrome-only extension. Use the drafts below.

One zip of `apps/extension/dist` is enough for both stores. Do not build a
Chrome package and an Edge package.

## Package now vs store later

Already on GitHub: source, icons, `privacy.html` in the extension, and this
document.

Wait until Pages is live before filling store dashboards: privacy-policy URL
and real screenshots.

## Generated assets

| File | Use |
| --- | --- |
| `apps/extension/public/icons/icon16.png` | Toolbar / management page |
| `apps/extension/public/icons/icon32.png` | Windows / high-DPI |
| `apps/extension/public/icons/icon48.png` | Extensions page |
| `apps/extension/public/icons/icon128.png` | Chrome Web Store package icon |
| `store-assets/logo-300.png` | Edge store logo (1:1, min 128) |
| `store-assets/small-promo-440x280.png` | Chrome small tile and Edge small promo |
| `store-assets/large-promo-1400x560.png` | Edge large promo tile (optional) |

Regenerate package icons from `store-assets/logo-300.png` after brand changes. This does not overwrite the custom store promo tiles.

```sh
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-extension-icons.ps1
```

## Permission justifications

Use the same wording in the Chrome dashboard. Edge reviewers may ask similar
questions.

**tabs**  
List, switch, and close currently open tabs on the new tab page, and save a tab
as a local bookmark-style link. HappyTab reads tab titles and URLs for that UI
only. It does not read full browsing history.

**storage**  
Store theme, language, sync opt-in, and provider credentials on this device.

**favicon**  
Show website icons next to open tabs and saved links via the extension favicon
API. This does not add an extra install warning when `tabs` is already declared.

**optional: https://api.cloudflare.com/***  
Requested only when the user tests or runs Cloudflare KV sync. Not granted at
install. Other providers (JSONBin, GitHub Gist, Upstash, custom REST) use
provider CORS and do not need host permissions.

## Chrome Web Store

- One-time developer registration fee.
- Localized name comes from `_locales/*/messages.json` (`appName`, max 45
  characters). Use `HappyTab - Bookmark Manager` (or the locale equivalent)
  so store search can match bookmark queries; do not drop the HappyTab brand.
- Short description comes from `_locales/*/messages.json` (`appDescription`,
  max 132 characters). Lead with bookmark manager on the new tab page, then
  local import/export, optional user-owned sync, and languages. Do not claim
  the browser’s built-in bookmarks or a first-party account.
- Category: Productivity.
- Privacy practices: the extension handles user data (open tab URLs, locally
  saved links/todos). It does **not** sell data. Remote storage happens only
  after the user enables sync, and only to a store they own or configure.
- Privacy policy URL:
  `https://miss55.github.io/happy-tab/privacy-policy.html`
- Disclose that install replaces the new tab page.
- Do not describe HappyTab as a search engine or default-search replacement.
  The search box only filters open tabs.

### Single purpose

HappyTab is a bookmark manager on the new tab page. Open tabs are how users
save and switch to pages; a small todo list stays on the same page. Keep the
listing focused on bookmarks, local backup, and optional user-owned sync. Do
not add unrelated search, shopping, or coupon claims. Do not describe HappyTab
as the browser’s built-in bookmark bar.

## Microsoft Edge Add-ons

- Free Partner Center account (personal Microsoft account).
- Long description is required and must be at least 250 characters. Do not copy
  Chrome-only wording. Edge policy asks listings not to sell the product as a
  Chrome extension.
- Logo: `store-assets/logo-300.png`.
- You can import the item from the Chrome Web Store after Chrome is published,
  then still fill Edge listing fields and the privacy URL.

You may load the same unpacked `apps/extension/dist` in Edge at
`edge://extensions` before submitting.

## Suggested English listing (Edge long description)

HappyTab is a bookmark manager on the new tab page. Save pages into groups you
control, drag to reorder, and open them from the same page. Open tabs appear
alongside so you can switch, close, or save them as bookmarks.

Bookmarks stay on this device by default. Export a JSON backup, import it on
another machine, or turn on optional sync to storage you already own: JSONBin,
GitHub Gist, Cloudflare KV, Upstash Redis, or a custom HTTPS endpoint. You can
encrypt that snapshot first. HappyTab does not run its own account server and
does not collect your data.

These are HappyTab bookmark groups on the new tab page. They do not replace or
sync the browser’s built-in bookmarks.

The interface is available in English, Simplified Chinese, Traditional Chinese,
Japanese, Korean, Spanish, French, and German. A small todo list is included on
the same page.

Works in this browser on this device, including Microsoft Edge. Bookmarks and
todos are not shared with another browser unless you import a backup or
configure sync yourself.

## Suggested Chinese listing (optional extra locale)

HappyTab 是一个长在新标签页上的书签管理器。把常用页面存进自己的分组，拖动排序，
并在同一页打开。当前打开的标签会列在旁边，方便切换、关闭，或保存为书签。

书签默认只保存在这台电脑。可以导出 JSON 备份、在另一台设备导入，或开启同步，
把快照发到你自己的 JSONBin、GitHub Gist、Cloudflare KV、Upstash Redis 或自定义
HTTPS 接口。可以先加密再上传。HappyTab 没有自有账号服务，也不会收集你的数据。

这是新标签页上的独立书签分组，不替换、不同步浏览器自带书签栏。

界面支持英语、简体中文、繁体中文、日语、韩语、西班牙语、法语和德语。同一页还
可以记待办。

不同浏览器之间的本地数据互不同步，除非你自行导入备份或配置同步。

## Package checklist

- [ ] `pnpm build:extension` and `pnpm check:manifest`
- [ ] Load unpacked in Chrome and Edge; confirm new tab override
- [ ] Confirm install does **not** ask for api.cloudflare.com
- [ ] Confirm Cloudflare test/sync prompts for that origin
- [ ] Zip `dist` files, not the folder
- [ ] Privacy policy URL is live HTTPS:
      `https://miss55.github.io/happy-tab/privacy-policy.html`
- [ ] Real 1280×800 screenshots of the current UI
- [ ] Edge listing does not say “Chrome-only”
