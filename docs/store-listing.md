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
- Short description comes from `_locales/*/messages.json` (`appDescription`,
  max 132 characters).
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

HappyTab is a local-first new tab workspace: open tabs, user-managed bookmark
groups, and a small todo list. Keep the listing focused on that workspace. Do
not add unrelated search, shopping, or coupon claims.

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

HappyTab replaces the new tab page with a local-first workspace. See the tabs
already open in each window, switch or close them, and save the ones you want
as bookmarks you organize into groups. A small todo list stays on the same
page.

Nothing is uploaded unless you turn on sync. If you do, HappyTab sends a
snapshot to storage you already own: JSONBin, GitHub Gist, Cloudflare KV,
Upstash Redis, or a custom HTTPS endpoint. You can encrypt that snapshot first.
HappyTab does not run its own account server and does not collect your data.

Works in this browser on this device, including Microsoft Edge. Open tabs,
bookmarks, and todos are not shared with another browser unless you configure
sync yourself.

## Suggested Chinese listing (optional extra locale)

HappyTab 用本地优先的工作台替换新标签页：按窗口查看当前打开的标签，切换或关闭，
并把常用页面存成你自己的书签分组。同一页还可以记待办。

默认同步关闭。只有你开启后，才会把快照发到你自己的 JSONBin、GitHub Gist、
Cloudflare KV、Upstash Redis 或自定义 HTTPS 接口。可以先加密再上传。HappyTab
没有自有账号服务，也不会收集你的数据。

不同浏览器之间的本地数据互不同步，除非你自行配置同步。

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
