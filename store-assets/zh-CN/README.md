# 简体中文商店预览图

按以下顺序上传 5 张 **1280 × 800 PNG**：

1. `01-workspace.png` — 标签与书签，井然有序。
2. `02-drag-to-save.png` — 轻轻一拖，留住好链接。
3. `03-themes.png` — 你的新标签页，你的风格。
4. `04-local-and-backup.png` — 你的书签，由你掌控。
5. `05-optional-sync.png` — 要不要同步，由你决定。

本套沿用英文版的版式、蓝色与青色强调色、明暗背景和展示顺序。
截图中的实际界面使用简体中文，分组、示例书签和标签页说明也已本地化。

## 原图保留

`i18n.png`、`local-storage.png`、`sync.png`、`theme.png` 是从
`store-assets/` 复制保留的原始中文图，未做修改。根目录原图及英文版图片同样保持不变。
`source/preserved-images.json` 记录了制作前已有图片的 SHA-256。

## 预览与源文件

- `source/contact-sheet.png`：5 张图片的半尺寸总览。
- `source/contact-sheet.html`：可在浏览器打开的总览。
- `source/01-*.html` 至 `source/05-*.html`：可编辑的中文排版，引用本地截图。
- `source/captures/`：从当前项目实际 Vue 界面截取的源图。
- `source/generate.mjs`：截图及排版生成脚本。
- `source/manifest.json`：语言、上传顺序、尺寸和原图校验信息。

演示数据在独立的临时 Chromium 配置中生成，不接触个人浏览数据。
站点图标使用本地首字母示例图标；拖动场景使用实际拖动状态，再加上说明箭头。
同步始终关闭，不使用凭据，也不请求第三方存储。生成过程不修改应用源码。

## 重新生成

在仓库根目录执行（需要已安装项目依赖及 Node.js 22+）：

```powershell
node store-assets/zh-CN/source/generate.mjs
```

脚本自动寻找 Windows 上的 Chrome 或 Edge，也可通过 `CHROME_PATH` 指定 Chromium。
它启动本地 Vite 服务，确认界面语言为简体中文，截取真实页面并导出 5 张成图。
原图使用 SHA-256 校验，避免生成时意外覆盖。

调整标题或版式后要保留到下次生成，请修改 `source/generate.mjs`。
生成后的 HTML 也可直接编辑；界面变化后应随发布源码重新生成。
