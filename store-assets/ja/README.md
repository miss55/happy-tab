# Tabvia · 日本語 商店预览图

本套使用与英文版、简体中文版一致的版式。实际 Vue 界面、演示分组、书签说明和宣传文案均使用 ja。

按以下顺序上传 5 张 **1280 × 800 PNG**：

1. `01-workspace.png` — 工作区全貌。
2. `02-drag-to-save.png` — 将打开的标签页拖入书签分组。
3. `03-themes.png` — 同一工作区的浅色、深色和毛玻璃效果。
4. `04-local-and-backup.png` — 本地保存与 JSON 备份。
5. `05-optional-sync.png` — 同步由用户选择开启，使用自己的存储服务。

## 预览与源文件

- `source/contact-sheet.png` / `source/contact-sheet.html`：整套总览。
- `source/captures/`：本语言的真实界面截图源文件。
- `source/01-*.html` 至 `source/05-*.html`：可编辑排版。
- `source/manifest.json`：尺寸、界面语言、上传顺序与排版检查结果。
- `source/generate.mjs`：本套生成入口。

旧素材保持原位；截图使用独立临时浏览器与虚构演示数据，不接触个人浏览数据。
示例站点图标为本地首字母图标，拖动箭头是添加的说明标注。云同步始终关闭，不使用任何凭据或第三方请求。

在仓库根目录重新生成本套（需要已安装依赖、Node.js 22+ 和 Chrome / Edge）：

```powershell
node store-assets/ja/source/generate.mjs
```

共用排版位于 `../source/render-locale.mjs`，本语言文案位于 `../source/locales.mjs`。
可通过 `CHROME_PATH` 指定 Chromium。原有中文、英文及其他素材不会被本套生成入口修改。
