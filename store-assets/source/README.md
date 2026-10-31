# 六种语言商店预览图

沿用英文版和简体中文版的五张预览图版式，每种语言输出 5 张 1280 × 800 PNG。

| 语言 | 目录 |
| --- | --- |
| 繁體中文 | `../zh-TW` |
| 日本語 | `../ja` |
| 한국어 | `../ko` |
| Español | `../es` |
| Français | `../fr` |
| Deutsch | `../de` |

打开 `index.html` 浏览六套首图，点击进入各套总览。各语言目录中的 `source/contact-sheet.png` 可直接预览五张成品。

`locales.mjs` 保存宣传文案和演示数据，`render-locale.mjs` 保存共享排版及真实界面截图流程。每套目录内另有独立入口、HTML 排版、原始界面截图与检查记录。截图使用虚构数据和临时浏览器配置，云同步关闭。

在仓库根目录运行（需要项目依赖、Node.js 22+、Chrome 或 Edge）：

```powershell
node store-assets/source/generate-locales.mjs
node store-assets/source/validate-locales.mjs
```

只重新生成部分语言：

```powershell
node store-assets/source/generate-locales.mjs fr de
```

可用 `CHROME_PATH` 指定 Chromium 可执行文件。重新生成会覆盖选中语言的本套成品及源文件，不改动已有中英文素材或根目录原图。批处理会校验其他目录的 PNG 没有变化；`preserved-images.json` 记录首次生成前 41 张已有图片的 SHA-256，供独立复核。

生成结果记录在 `generation-report.json`；独立检查结果记录在 `validation-report.json`。每张成品的溢出、重叠及字号调整结果位于本语言的 `source/manifest.json`。
