import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderLocale } from './render-locale.mjs';
import { locales } from './locales.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const assets=path.dirname(here);
const requested=process.argv.slice(2).filter(arg=>!arg.startsWith('--'));
const selected=requested.length?requested:Object.keys(locales);
for(const locale of selected) if(!locales[locale]) throw new Error('Unknown locale: '+locale);
const existing=[];
async function remember(directory) {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const full=path.join(directory,entry.name);
    if(entry.isDirectory()) {
      // Previously generated files in requested locales are regenerated deliberately.
      if(directory===assets && selected.includes(entry.name)) continue;
      await remember(full);
    } else if(entry.name.endsWith('.png')) {
      existing.push({path:full,sha256:createHash('sha256').update(await readFile(full)).digest('hex')});
    }
  }
}
await remember(assets);
const failures=[];
for(const locale of selected) {
  const directory=path.join(assets,locale);
  await mkdir(path.join(directory,'source'),{recursive:true});
  await writeFile(path.join(directory,'source/generate.mjs'),
    `import { renderLocale } from '../../source/render-locale.mjs';\nawait renderLocale('${locale}');\n`);
  await writeFile(path.join(directory,'README.md'),`# Tabvia · ${locales[locale].native} 商店预览图

本套使用与英文版、简体中文版一致的版式。实际 Vue 界面、演示分组、书签说明和宣传文案均使用 ${locale}。

按以下顺序上传 5 张 **1280 × 800 PNG**：

1. \`01-workspace.png\` — 工作区全貌。
2. \`02-drag-to-save.png\` — 将打开的标签页拖入书签分组。
3. \`03-themes.png\` — 同一工作区的浅色、深色和毛玻璃效果。
4. \`04-local-and-backup.png\` — 本地保存与 JSON 备份。
5. \`05-optional-sync.png\` — 同步由用户选择开启，使用自己的存储服务。

## 预览与源文件

- \`source/contact-sheet.png\` / \`source/contact-sheet.html\`：整套总览。
- \`source/captures/\`：本语言的真实界面截图源文件。
- \`source/01-*.html\` 至 \`source/05-*.html\`：可编辑排版。
- \`source/manifest.json\`：尺寸、界面语言、上传顺序与排版检查结果。
- \`source/generate.mjs\`：本套生成入口。

旧素材保持原位；截图使用独立临时浏览器与虚构演示数据，不接触个人浏览数据。
示例站点图标为本地首字母图标，拖动箭头是添加的说明标注。云同步始终关闭，不使用任何凭据或第三方请求。

在仓库根目录重新生成本套（需要已安装依赖、Node.js 22+ 和 Chrome / Edge）：

\`\`\`powershell
node store-assets/${locale}/source/generate.mjs
\`\`\`

共用排版位于 \`../source/render-locale.mjs\`，本语言文案位于 \`../source/locales.mjs\`。
可通过 \`CHROME_PATH\` 指定 Chromium。原有中文、英文及其他素材不会被本套生成入口修改。
`);
  console.log('START',locale);
  try { await renderLocale(locale); }
  catch(error) { failures.push({locale,error:error.stack||String(error)});console.error('FAILED',locale,error.message); }
}
for(const original of existing) {
  const actual=createHash('sha256').update(await readFile(original.path)).digest('hex');
  if(actual!==original.sha256) throw new Error('Existing image changed: '+original.path);
}
const report={locales:selected,unchangedExistingPNGs:existing.length,failures};
await writeFile(path.join(here,'generation-report.json'),JSON.stringify(report,null,2)+'\n');
const index=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Tabvia · 多语言商店预览图</title><style>*{box-sizing:border-box}body{margin:32px;background:#edf2fa;color:#15243c;font-family:'Microsoft YaHei','Segoe UI',sans-serif}h1{font-size:28px}p{color:#586980}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:28px}a{display:block;background:white;border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 10px 30px #163b6912}img{display:block;width:100%;height:auto}strong{display:block;padding:16px 20px}</style></head><body><h1>Tabvia · 多语言商店预览图</h1><p>每种语言 5 张 1280 × 800 PNG，点击首图查看整套总览。</p><main>${Object.entries(locales).map(([code,config])=>`<a href="../${code}/source/contact-sheet.html"><img src="../${code}/01-workspace.png"><strong>${config.native} · ${code}</strong></a>`).join('')}</main></body></html>`;
await writeFile(path.join(here,'index.html'),index);
console.log(JSON.stringify(report));
if(failures.length) process.exitCode=1;
