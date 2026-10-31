# Tabvia

[English](./README.md) | **简体中文** | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md)

Tabvia 是一款替换浏览器新标签页的书签管理器。当前扩展版本为 **0.2.5**，详见[更新日志](./CHANGELOG.md)。

在本地保存和分组管理链接，导入或导出 JSON 备份，也可以选择将数据快照同步到你自己的第三方存储。Tabvia 采用本地优先架构，无需登录，也没有自建后端。界面支持英语、简体中文、繁体中文、日语、韩语、西班牙语、法语和德语。

本仓库使用 pnpm workspace，产品代码位于 `apps/extension`，是一款 Manifest V3 扩展。Tabvia 管理的书签独立于浏览器内置书签栏。

- 源代码：[miss55/happy-tab](https://github.com/miss55/happy-tab)
- 问题反馈：[GitHub Issues](https://github.com/miss55/happy-tab/issues)
- 隐私政策：[在线隐私政策](https://miss55.github.io/happy-tab/privacy-policy.html)

## 仓库结构

- `apps/extension`：使用 Vite、Vue 3 和 TypeScript 开发的 Chrome MV3 扩展。
- `docs`：产品与架构文档。

## 开发

在仓库根目录运行：

```sh
# 安装依赖
pnpm install
# 启动扩展开发服务器
pnpm dev:extension
# 校验扩展清单
pnpm check:manifest
# 运行前端测试
pnpm test
# 构建扩展（包含 TypeScript 检查）
pnpm build:extension
```

在 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions` 中开启开发者模式，选择“加载已解压的扩展程序”，加载 `apps/extension/dist`，然后打开新标签页。

Chrome Web Store 和 Microsoft Edge Add-ons 的打包说明见[商店上架文档](./docs/store-listing.md)，商店所需的隐私政策见[隐私政策文档](./docs/privacy-policy.md)。将 GitHub Pages 的发布目录设为 `main` 分支的 `docs/` 后，可在两个商店后台填写 `https://miss55.github.io/happy-tab/privacy-policy.html`。

## 当前功能

本地新标签页 MVP 与可选的第三方云端快照同步均已实现。

- 替换 Chrome 新标签页，同一扩展包也支持 Microsoft Edge。
- 按浏览器窗口展示当前打开的标签页，支持切换和关闭。
- 将链接分组、书签链接和待办事项保存在 IndexedDB，通过仓储层和 Dexie 读写业务数据。
- 创建、重命名、删除和拖拽排序链接分组。
- 使用书签分页组织分组：创建、重命名、排序和删除空分页，通过编辑控件跨页移动分组或链接。快捷导航、浏览器标签页和可选待办列表在各分页间共享。
- 点击按钮或将浏览器标签页拖到链接分组中，保存为书签链接；也可手动输入 URL 添加。
- 在新标签页打开书签链接，同时记录打开次数和最近打开时间。
- 在同一分组内或不同分组之间拖拽排序书签链接。
- 创建、完成或取消完成、编辑、删除和拖拽排序待办事项。待办列表默认隐藏，可在“导入 / 导出”中开启。
- 提供八种界面语言，自动识别浏览器语言，并在本地记住手动选择。
- 导出带版本号的 JSON 备份，校验后以合并或替换模式导入书签分页、链接分组、链接、待办、使用统计和快捷导航。第 2 版备份保留分页归属，也兼容第 1 版备份。
- 支持 Soft、Minimal、Glass、Fluent、OLED、Cyber 六种主题，浅色、深色和跟随系统模式，强调色、内置壁纸及本地自定义背景；应用加载前即可恢复已保存的外观。
- 书签上方提供快捷导航栏，可输入 URL 或拖入浏览器标签页、书签链接来添加快捷方式，支持排序、编辑、删除，以及在当前页面会话内撤销删除。
- 链接分组采用瀑布流布局，自动分配柔和的标题栏颜色，也可逐组调整。
- 可选同步到你自己的 Upstash Redis、GitHub Gist、Cloudflare KV、JSONBin 或自定义 REST 接口，快照包含书签分页和快捷导航。

使用多个书签分页前，请先更新所有参与同步的设备，旧客户端无法保留分页集合。迁移、备份和同步兼容性详见[书签分页说明](./docs/bookmark-pages.md)。

仍待完善或验证：

- 在现有单元测试及分页、主题浏览器检查之外，补充更广泛的自动化覆盖。
- 在 Chrome 和 Edge 中完成已解压扩展的完整回归测试。

浏览器原生书签同步不在当前范围内。

## 文档语言

顶部链接可切换八种语言的 README。扩展开发指南、更新日志及 `docs/` 中的详细文档目前为英文。

## 许可证

[MIT](./LICENSE)
