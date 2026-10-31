# Tabvia

[English](./README.md) | [简体中文](./README.zh-CN.md) | **繁體中文** | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md)

Tabvia 是一款取代瀏覽器新分頁的書籤管理工具。目前擴充功能版本為 **0.2.5**，詳見[更新紀錄](./CHANGELOG.md)。

在本機儲存連結並分組管理，匯入或匯出 JSON 備份，也可選擇將資料快照同步到你自己的第三方儲存空間。Tabvia 採用本機優先架構，無須登入，也沒有自建後端。介面支援英文、簡體中文、繁體中文、日文、韓文、西班牙文、法文和德文。

本儲存庫使用 pnpm workspace，產品程式碼位於 `apps/extension`，是一款 Manifest V3 擴充功能。Tabvia 管理的書籤獨立於瀏覽器內建的書籤列。

- 原始碼：[miss55/happy-tab](https://github.com/miss55/happy-tab)
- 問題回報：[GitHub Issues](https://github.com/miss55/happy-tab/issues)
- 隱私權政策：[線上隱私權政策](https://miss55.github.io/happy-tab/privacy-policy.html)

## 儲存庫結構

- `apps/extension`：以 Vite、Vue 3 和 TypeScript 開發的 Chrome MV3 擴充功能。
- `docs`：產品與架構文件。

## 開發

在儲存庫根目錄執行：

```sh
# 安裝相依套件
pnpm install
# 啟動擴充功能開發伺服器
pnpm dev:extension
# 驗證擴充功能資訊清單
pnpm check:manifest
# 執行前端測試
pnpm test
# 建置擴充功能（包含 TypeScript 檢查）
pnpm build:extension
```

在 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions` 開啟開發人員模式，選擇「載入未封裝項目」，載入 `apps/extension/dist`，再開啟新分頁。

Chrome Web Store 與 Microsoft Edge Add-ons 的封裝說明請見[商店上架文件](./docs/store-listing.md)，商店所需的隱私權政策請見[隱私權政策文件](./docs/privacy-policy.md)。將 GitHub Pages 的發佈目錄設為 `main` 分支的 `docs/` 後，可在兩個商店後台填入 `https://miss55.github.io/happy-tab/privacy-policy.html`。

## 目前功能

本機新分頁 MVP 與選用的第三方雲端快照同步均已實作。

- 取代 Chrome 新分頁，同一擴充功能套件也支援 Microsoft Edge。
- 依瀏覽器視窗顯示目前開啟的分頁，支援切換與關閉。
- 將連結群組、書籤連結與待辦事項儲存在 IndexedDB，透過儲存庫層與 Dexie 存取業務資料。
- 建立、重新命名、刪除及拖曳排序連結群組。
- 使用書籤頁面整理群組：建立、重新命名、排序及刪除空頁面，透過編輯控制項跨頁移動群組或連結。快速導覽、瀏覽器分頁及選用的待辦清單在各頁面間共用。
- 點擊按鈕或將瀏覽器分頁拖曳至連結群組，儲存為書籤連結；也可手動輸入 URL 新增。
- 在新分頁開啟書籤連結，同時記錄開啟次數與最近開啟時間。
- 在同一群組內或不同群組之間拖曳排序書籤連結。
- 建立、完成或取消完成、編輯、刪除及拖曳排序待辦事項。待辦清單預設隱藏，可在「匯入 / 匯出」中開啟。
- 提供八種介面語言，自動偵測瀏覽器語言，並在本機記住手動選擇。
- 匯出含版本號的 JSON 備份，驗證後以合併或取代模式匯入書籤頁面、連結群組、連結、待辦、使用統計與快速導覽。第 2 版備份保留頁面歸屬，也支援第 1 版備份。
- 支援 Soft、Minimal、Glass、Fluent、OLED、Cyber 六種主題，淺色、深色及跟隨系統模式，強調色、內建桌布及本機自訂背景；應用程式載入前即可還原已儲存的外觀。
- 書籤上方提供快速導覽列，可輸入 URL 或拖入瀏覽器分頁、書籤連結來新增捷徑，支援排序、編輯、刪除，以及在目前頁面工作階段內復原刪除。
- 連結群組採用瀑布流版面配置，自動分配柔和的標題列色彩，也可逐組調整。
- 可選擇同步至你自己的 Upstash Redis、GitHub Gist、Cloudflare KV、JSONBin 或自訂 REST 端點，快照包含書籤頁面與快速導覽。

使用多個書籤頁面前，請先更新所有參與同步的裝置，舊版用戶端無法保留頁面集合。移轉、備份與同步相容性詳見[書籤頁面說明](./docs/bookmark-pages.md)。

仍待完善或驗證：

- 在現有單元測試及頁面、主題瀏覽器檢查之外，補充更廣泛的自動化涵蓋範圍。
- 在 Chrome 與 Edge 中完成未封裝擴充功能的完整迴歸測試。

瀏覽器原生書籤同步不在目前範圍內。

## 文件語言

頂部連結可切換八種語言的 README。擴充功能開發指南、更新紀錄及 `docs/` 中的詳細文件目前為英文。

## 授權條款

[MIT](./LICENSE)
