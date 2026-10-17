---
name: package-extension
description: 为 Tabvia 构建并校验 Chrome Web Store 提交用 ZIP。当用户要求打包扩展、生成商店提交包、build 后压缩或准备扩展发布包时使用；不负责上传或发布商店。
---

# Tabvia 扩展商店打包

在项目根目录执行以下命令（Windows PowerShell，需 Node.js 和 pnpm）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .agents/skills/package-extension/scripts/package-extension.ps1
```

脚本按顺序执行 `pnpm check:manifest`、`pnpm test`、`pnpm build:extension`。构建命令本身包含 TypeScript 检查。任一步失败立即停止，不使用旧 dist 继续打包。依赖未安装时，先运行 `pnpm install --frozen-lockfile`；不要自动更新锁文件或绕过失败检查。当前没有 lint 命令，不声称已运行 lint。

脚本核对构建 Manifest 与扩展 package.json 版本一致、入口和图标及语言文件齐全，之后仅将 `apps/extension/dist` 内容写入 ZIP。`manifest.json` 必须在 ZIP 根目录，条目使用 `/` 分隔。脚本重新打开 ZIP，检查条目清单和每个文件的 SHA-256，并输出 ZIP 路径、版本、大小和 SHA-256。

输出到 `dist/store/tabvia-<manifest.version>-<UTC 时间戳>-<随机后缀>.zip`，该目录已被 Git 忽略。每次产生独立文件，保留旧包。版本取扩展 Manifest，不取根 package.json；不要自行升级版本。如果版本不一致，报告具体值，按用户指定的目标版本处理后重新打包。

完成后提供 ZIP 的绝对路径链接及校验结果。自动检查成功只表示本地构建和打包成功；没有实际操作浏览器就不能声称通过浏览器回归或商店审核。

若用户要求提交前完整检查，阅读项目根目录的 `docs/store-listing.md`，核对 Chrome 加载解压后的 `apps/extension/dist`、新标签页行为、可选权限、真实截图和隐私政策链接。更新已发布扩展时，确认版本高于商店现有版本；未知时如实说明，不能从本地版本推断。仅打包无需商店账号。上传、提交审核和发布需要用户明确要求。
