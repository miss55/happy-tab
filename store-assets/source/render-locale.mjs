/** Render localized store images with the real Vue UI and isolated sample data. */
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { locales } from './locales.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export async function renderLocale(locale) {
const config = locales[locale];
if (!config) throw new Error('Unsupported store locale: ' + locale);
const root = repositoryRoot;
const output = path.join(root, 'store-assets', locale);
const here = path.join(output, 'source');
const captures = path.join(here, 'captures');
const extensionRoot = path.join(root, 'apps/extension');
const require = createRequire(path.join(extensionRoot, 'package.json'));
const viteRoot = path.dirname(require.resolve('vite/package.json'));
const { createServer } = await import(pathToFileURL(path.join(viteRoot, 'dist/node/index.js')).href);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const originalNames = [];
for (const name of ['i18n.png', 'local-storage.png', 'sync.png', 'theme.png']) {
  try { await access(path.join(output, name)); originalNames.push(name); } catch { /* No legacy originals for a new locale. */ }
}
const originals = Object.fromEntries(await Promise.all(originalNames.map(async name => [name,
  createHash('sha256').update(await readFile(path.join(output, name))).digest('hex')])));
await mkdir(captures, { recursive: true });

// These are sample records, never imported into a user's browser profile.
const groups = [
  ['Work', 0, [
    ['Notion · Project hub', 'https://www.notion.so/'],
    ['Google Drive · Team files', 'https://drive.google.com/'],
    ['Linear · Sprint board', 'https://linear.app/'],
    ['Slack · Team conversations', 'https://slack.com/']
  ]],
  ['Design', 4, [
    ['Figma · Product design', 'https://www.figma.com/'],
    ['Dribbble · Fresh inspiration', 'https://dribbble.com/'],
    ['Coolors · Color palettes', 'https://coolors.co/'],
    ['Unsplash · Photography', 'https://unsplash.com/']
  ]],
  ['Development', 7, [
    ['GitHub · My repositories', 'https://github.com/'],
    ['MDN · Web documentation', 'https://developer.mozilla.org/'],
    ['Vue.js · Developer guide', 'https://vuejs.org/'],
    ['Vite · Build tools', 'https://vite.dev/']
  ]],
  ['Reading', 2, [
    ['The Verge · Technology', 'https://www.theverge.com/'],
    ['Hacker News · Daily reads', 'https://news.ycombinator.com/'],
    ['Smashing Magazine · Articles', 'https://www.smashingmagazine.com/'],
    ['CSS-Tricks · Frontend notes', 'https://css-tricks.com/']
  ]],
  ['Research', 8, [
    ['Wikipedia · Reference', 'https://en.wikipedia.org/'],
    ['Google Scholar · Papers', 'https://scholar.google.com/'],
    ['Are.na · Collections', 'https://www.are.na/'],
    ['A List Apart · Web thinking', 'https://alistapart.com/']
  ]],
  ['Everyday', 6, [
    ['Gmail · Inbox', 'https://mail.google.com/'],
    ['Google Calendar · My week', 'https://calendar.google.com/'],
    ['YouTube · Watch later', 'https://www.youtube.com/'],
    ['Spotify · Focus playlist', 'https://open.spotify.com/']
  ]]
];
const sampleWindows = [
  { id: 1, focused: true, type: 'normal', tabs: [
    { id: 101, title: 'Figma · Brand exploration', url: 'https://www.figma.com/design/' },
    { id: 102, title: 'GitHub · Pull requests', url: 'https://github.com/pulls' },
    { id: 103, title: 'Notion · Meeting notes', url: 'https://www.notion.so/notes' },
    { id: 104, title: 'MDN · CSS Grid', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/grid' }
  ] },
  { id: 2, focused: false, type: 'normal', tabs: [
    { id: 201, title: 'Unsplash · Workspace ideas', url: 'https://unsplash.com/s/photos/workspace' },
    { id: 202, title: 'Coolors · New palette', url: 'https://coolors.co/palettes/trending' },
    { id: 203, title: 'The Verge · Latest stories', url: 'https://www.theverge.com/tech' }
  ] }
].map(window => ({ ...window, tabs: window.tabs.map((tab, i) => ({ ...tab, windowId: window.id,
  active: false, pinned: false, lastAccessed: 1000 - i })) }));
groups.forEach((group, groupIndex) => {
  group[0] = config.groups[groupIndex];
  group[2].forEach((link, linkIndex) => {
    link[0] = link[0].split(' · ')[0] + ' · ' + config.links[groupIndex][linkIndex];
  });
});
sampleWindows.flatMap(window => window.tabs).forEach((tab, index) => {
  tab.title = tab.title.split(' · ')[0] + ' · ' + config.tabs[index];
});

let executable;
for (const candidate of [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean)) {
  try { await access(candidate); executable = candidate; break; } catch { /* Try next. */ }
}
if (!executable) throw new Error('Set CHROME_PATH to an installed Chromium browser.');
const profile = await mkdtemp(path.join(tmpdir(), 'tabvia-store-' + locale + '-'));
let server, browser, socket;

try {
  // Local assets only: no icon service, credentials, or sync requests.
  const iconMiddleware = (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const host = new URL(url.searchParams.get('pageUrl') || 'https://example.com').hostname.replace(/^www\./, '');
    const known = { 'figma.com': ['F', '#9257dc'], 'github.com': ['G', '#242b3d'],
      'notion.so': ['N', '#222a35'], 'developer.mozilla.org': ['M', '#3157c5'],
      'drive.google.com': ['D', '#2b9f74'], 'linear.app': ['L', '#6657d8'],
      'slack.com': ['S', '#72487a'], 'dribbble.com': ['D', '#d45b8d'],
      'coolors.co': ['C', '#3671db'], 'unsplash.com': ['U', '#34414a'],
      'vuejs.org': ['V', '#249770'], 'vite.dev': ['V', '#8860d8'],
      'news.ycombinator.com': ['Y', '#e87532'], 'mail.google.com': ['M', '#d45b53'],
      'calendar.google.com': ['31', '#3879da'], 'youtube.com': ['▶', '#de4b4b'],
      'open.spotify.com': ['S', '#219e62'] };
    const [letter, color] = known[host] || [host[0].toUpperCase(), '#65748d'];
    res.setHeader('Content-Type', 'image/svg+xml');
    res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="7" fill="${color}"/><text x="16" y="22" text-anchor="middle" fill="white" font-family="Arial" font-size="19" font-weight="700">${letter}</text></svg>`);
  };
  server = await createServer({ root: extensionRoot, logLevel: 'error',
    plugins: [{name:'store-capture-icons', configureServer(server) {
      server.middlewares.use('/__store/icon', iconMiddleware);
    }}],
    server: { host: '127.0.0.1', port: 0, fs: { allow: [root] } } });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = spawn(executable, ['--headless', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    '--force-color-profile=srgb', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { windowsHide: true, stdio: 'ignore' });
  let launchError;
  browser.on('error', error => { launchError = error; });
  let port;
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError;
    try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  if (!port) throw new Error('Disposable browser did not start.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 30000);
    pending.set(id, message => { clearTimeout(timer); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result); });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result?.value;
  };
  const viewport = async (width, height, scale = 1) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
    await delay(150);
  };
  const capture = async (name, clip) => {
    await delay(300);
    const result = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    await writeFile(path.join(captures, name + '.png'), Buffer.from(result.data, 'base64'));
    return result.data;
  };
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const windows = ${JSON.stringify(sampleWindows)};
    for (const window of windows) for (const tab of window.tabs)
      tab.favIconUrl = location.origin + '/__store/icon?pageUrl=' + encodeURIComponent(tab.url);
    globalThis.chrome = Object.assign(globalThis.chrome || {}, {
      windows: {getAll: async () => structuredClone(windows), update: async () => {}},
      tabs: {update: async () => {}, remove: async () => {},
        onUpdated: {addListener() {}, removeListener() {}}},
      runtime: {getURL: pathname => location.origin + (pathname.includes('_favicon') ? '/__store/icon' : pathname)}
    });
    localStorage.setItem('happy_tab_locale', JSON.stringify(${JSON.stringify(locale)}));
  })();` });
  await viewport(1280, 560);
  await send('Page.navigate', { url: base });
  for (let i = 0; i < 100; i++) {
    if (await evaluate("Boolean(document.querySelector('.link-groups'))")) break;
    await delay(100);
  }
  // Let the initial empty-workspace bootstrap finish before replacing fixtures.
  await delay(900);
  await evaluate(`(async () => {
    const {tabviaDb: db} = await import('/src/db/tabviaDb.ts');
    const {DEFAULT_BOOKMARK_PAGE_ID, createDefaultBookmarkPage} = await import('/src/types/bookmarkPages.ts');
    const definitions = ${JSON.stringify(groups)};
    const timestamp = '2026-10-01T00:00:00.000Z';
    await db.link_groups.clear(); await db.links.clear(); await db.todos.clear(); await db.sync_queue.clear();
    await db.nav_shortcuts.clear();
    await db.bookmark_pages.put(createDefaultBookmarkPage());
    for (let g = 0; g < definitions.length; g++) {
      const [name, color, entries] = definitions[g];
      const id = '10000000-0000-4000-8000-' + String(g + 1).padStart(12, '0');
      await db.link_groups.put({id, page_id: DEFAULT_BOOKMARK_PAGE_ID, name,
        color: 'palette:' + (30 + color), sort_order: g, created_at: timestamp, updated_at: timestamp});
      await db.links.bulkPut(entries.slice(0,3).map(([title, url], i) => ({
        id: '20000000-0000-4000-8000-' + String(g * 10 + i + 1).padStart(12, '0'),
        group_id: id, title, url, favicon_url: location.origin + '/__store/icon?pageUrl=' + encodeURIComponent(url),
        sort_order: i, open_count: [18, 12, 8, 4][i], source: 'manual',
        created_at: timestamp, updated_at: timestamp
      })));
    }
    const {useLinksStore} = await import('/src/stores/linksStore.ts');
    await useLinksStore().loadLinks();
    const shortcuts = [definitions[0][2][0], definitions[1][2][0], definitions[2][2][0],
      definitions[5][2][0], definitions[5][2][1], definitions[5][2][3]];
    await db.nav_shortcuts.bulkPut(shortcuts.map(([title,url],i) => ({
      id: '30000000-0000-4000-8000-' + String(i+1).padStart(12,'0'),
      title: title.split(' · ')[0], url,
      favicon_url: location.origin + '/__store/icon?pageUrl=' + encodeURIComponent(url),
      sort_order:i, created_at:timestamp, updated_at:timestamp
    })));
    const {useNavStore} = await import('/src/stores/navStore.ts');
    await useNavStore().loadShortcuts();
    const theme = await import('/src/services/theme.ts');
    await theme.setThemeStyle('soft'); await theme.setThemeMode('light'); await theme.setThemePalette('blue');
    await theme.updateThemeBackground({type:'solid'});
    await theme.updateThemeEffects({animation:false, blur:true, glow:false});
    const {setShowTodos} = await import('/src/services/workspaceSettings.ts');
    await setShowTodos(false);
    document.body.style.zoom = '0.8';
    await document.fonts.ready;
  })()`);
  if (await evaluate('document.documentElement.lang') !== locale)
    throw new Error('UI locale was not applied: ' + locale);
  await viewport(1280, 580);
  await delay(600);
  await capture('workspace');
  console.log('UI geometry', await evaluate(`JSON.stringify({groups: [...document.querySelectorAll('.link-group')].map(el => {
    const {x,y,width,height} = el.getBoundingClientRect(); return {name: el.querySelector('h3')?.textContent, x,y,width,height};
  }), saved: (()=>{const {x,y,width,height}=document.querySelector('.saved-links-column').getBoundingClientRect();return {x,y,width,height}})()})`));

  // Additional capture and composition stages below.
  if (process.argv.includes('--inspect')) {
    console.log('Initial UI capture written to', captures);
  } else {
    const rect = selector => evaluate(`(() => {
      const {x,y,width,height}=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
      return {x:Math.floor(x),y:Math.floor(y),width:Math.ceil(width),height:Math.ceil(height)};
    })()`);
    const closeDialog = async () => {
      await evaluate("document.querySelector('.modal-backdrop .close-button')?.click()");
      await delay(180);
    };
    const setTheme = async (style, mode, background = 'solid') => {
      await evaluate(`(async () => {
        const theme=await import('/src/services/theme.ts');
        await theme.setThemeStyle('${style}'); await theme.setThemeMode('${mode}');
        await theme.updateThemeBackground({type:'${background}',wallpaperId:'lavender-sky'});
      })()`);
      await delay(300);
    };
    // Capture a real Vue drag state. The final composition adds only an explanatory arrow.
    await viewport(1280, 660);
    const dragGeometry = await evaluate(`(() => {
      const row=document.querySelectorAll('.tab-row')[2];
      const group=document.querySelector('.link-group[data-group-id]');
      const source=row.getBoundingClientRect();
      const target=group.querySelectorAll('.saved-link-row')[1].getBoundingClientRect();
      window.storeDragTransfer=new DataTransfer();
      row.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,
        clientX:source.x+75,clientY:source.y+source.height/2,dataTransfer:window.storeDragTransfer}));
      group.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,
        clientX:target.x+55,clientY:target.y+target.height/2,dataTransfer:window.storeDragTransfer}));
      return {from:{x:source.x+75,y:source.y+source.height/2},to:{x:target.x+55,y:target.y+target.height/2}};
    })()`);
    await delay(300);
    const dragTop = Math.max(0, (await rect('.window-header')).y - 10);
    const previewRect = await rect('.link-drag-preview');
    const arrowEnd = {x: previewRect.x + 16, y: previewRect.y - dragTop + 8};
    const arrowStart = {x: 185, y: dragGeometry.from.y - dragTop};
    const arrowPath = `M ${arrowStart.x} ${arrowStart.y} C 250 ${Math.max(20,arrowStart.y-78)}, 275 ${Math.max(25,arrowEnd.y-90)}, ${arrowEnd.x} ${arrowEnd.y}`;
    await capture('drag', {x:0,y:dragTop,width:640,height:420});
    console.log('Drag geometry', JSON.stringify(dragGeometry));
    await evaluate("document.querySelectorAll('.tab-row')[2].dispatchEvent(new DragEvent('dragend',{bubbles:true}));");
    await delay(180);

    // Compare the actual same bookmark groups under three supported theme settings.
    for (const [name,style,mode,background] of [
      ['theme-light','soft','light','solid'],
      ['theme-dark','soft','dark','solid'],
      ['theme-glass','glass','light','wallpaper']
    ]) {
      await setTheme(style,mode,background);
      const groupRect=await rect('.link-group[data-group-id]');
      await capture(name,{x:groupRect.x-21,y:groupRect.y-55,width:groupRect.width+42,height:370});
    }
    await setTheme('soft','light');
    await evaluate("document.body.style.zoom='1'");
    await viewport(1280, 1000);
    await evaluate("document.querySelector('.data-panel-button').click()");
    await delay(450);
    const backupBounds=await rect('.modal-backdrop .data-dialog');
    const backupRect={x:backupBounds.x+1,y:backupBounds.y+1,width:backupBounds.width-2,height:backupBounds.height-2};
    await capture('backup',backupRect);
    console.log('Backup',JSON.stringify(backupRect));
    await closeDialog();
    await evaluate("document.querySelector('.sync-panel-button').click()");
    await evaluate("document.querySelector('.provider-setup-guide > summary')?.click()");
    await delay(450);
    const syncRect=await rect('.sync-dialog');
    const fieldsRect=await rect('.sync-dialog .provider-fields');
    await capture('sync-choice',{...syncRect,height:fieldsRect.y-syncRect.y-12});
    console.log('Sync header',JSON.stringify({...syncRect,height:fieldsRect.y-syncRect.y-12}));
    await closeDialog();

    // All typography and annotations are editable HTML; the UI is captured above.
    const asset = async name => 'captures/'+name+'.png';
    const assets = Object.fromEntries(await Promise.all(['workspace','drag','theme-light','theme-dark','theme-glass','backup','sync-choice'].map(async name => [name,await asset(name)])));
    const logo = '../../logo-300.png';
    const icon = (name,size=24) => {
      const paths={
        check:'<path d="m5 12 4 4L19 6"/>',
        lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
        download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
        folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9H3Z"/>',
        globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
        cloud:'<path d="M7 18a5 5 0 1 1 1-9 6 6 0 0 1 11 3 3 3 0 0 1-1 6Z"/>',
        tab:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.1M10 6.5h.1"/>',
      };
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
    };
    const common = `
      *{box-sizing:border-box}html,body{width:1280px;height:800px;overflow:hidden;margin:0}
      body{font-family:'${config.font}','Segoe UI',Arial,sans-serif;background:#f4f7fc;color:#15243c;-webkit-font-smoothing:antialiased}
      .slide{position:relative;width:1280px;height:800px;overflow:hidden;background:radial-gradient(ellipse at 94% 18%,#e3eefc 0,transparent 48%),#f4f7fc}
      .brand{position:absolute;left:48px;top:26px;display:flex;align-items:center;gap:11px;font-size:23px;font-weight:700;letter-spacing:-.6px}
      .brand img{width:35px;height:35px;border-radius:10px}.brand span{padding-bottom:2px}
      .series{position:absolute;right:48px;top:36px;color:#64748b;font-size:12px;font-weight:650;letter-spacing:2px}
      h1{position:absolute;left:48px;top:89px;margin:0;font-size:52px;line-height:1.12;letter-spacing:${config.cjk?'-.7':'-1.8'}px;font-weight:700}
      .wide-title{width:1184px;white-space:nowrap}.side-title{width:400px;line-height:1.13!important}
      .side-title .line{display:block;white-space:nowrap}.sub{max-width:1180px}.side-sub{max-height:86px}
      .blue{color:#2268f5}.sub{position:absolute;left:50px;top:158px;margin:0;font-size:22px;line-height:1.5;color:#586980}
      .frame{overflow:hidden;border:1px solid #dae2ee;border-radius:16px;box-shadow:0 20px 48px #163b6918;background:white}
      .frame img{display:block;width:100%;height:auto}
      .foot{position:absolute;bottom:26px;left:50px;right:50px;display:flex;align-items:center;justify-content:space-between;color:#61728a;font-size:14px}
      .foot .features{display:flex;align-items:center;gap:22px}.foot .features span{display:flex;align-items:center;gap:7px;white-space:nowrap}
      .foot svg{color:#2878dc;width:16px;height:16px;flex:none}.foot .tag{font-size:11px;font-weight:700;letter-spacing:${config.cjk?'1':'1.3'}px;white-space:nowrap}
      .dark{background:radial-gradient(ellipse at 95% 25%,#193652 0,transparent 58%),#101e32;color:#fff}
      .dark .series,.dark .foot{color:#9db0ca}.dark .sub{color:#b1c1d8}.dark .blue{color:#68d6dd}.dark .frame{border-color:#55739455;box-shadow:0 24px 70px #030e214d}
      .eyebrow{color:#246af0;font-size:12px;font-weight:700;letter-spacing:2px}.dark .eyebrow{color:#66d1dc}
      .feature-row{display:flex;align-items:center;gap:14px;font-size:19px;line-height:1.4;color:#34475f;width:100%}
      .feature-row>span{display:block;min-width:0;flex:1;white-space:nowrap}
      .feature-row i{display:grid;place-items:center;flex:none;width:37px;height:37px;border-radius:11px;color:#2268f5;background:#e7efff;font-style:normal}
      .dark .feature-row{color:#dae5f4}.dark .feature-row i{background:#203a52;color:#69d7de}
      .theme-label{display:block;white-space:nowrap;font-size:20px;line-height:1.15}
      .theme-description{margin:6px 0 0;color:#687a91;font-size:12px;line-height:1.25;white-space:nowrap}
      .provider{height:55px;border:1px solid #365169;background:#172a41;border-radius:12px;display:flex;align-items:center;gap:10px;padding:0 15px;color:#e2edf9;font-size:17px;white-space:nowrap}
    `;
    const brand = n => `<div class="brand"><img src="${logo}"><span>Tabvia</span></div><div class="series">${config.series}&nbsp;&nbsp; / &nbsp;&nbsp;0${n}</div>`;
    const foot = (features,tag) => `<div class="foot"><div class="features">${features.map(([name,label])=>`<span>${icon(name)}${label}</span>`).join('')}</div><span class="tag">${tag}</span></div>`;
    const featureFooter = (block, icons) => foot(block.features.map((label,i)=>[icons[i],label]), block.tag);
    const title = (block, side=false, size=58) => side
      ? `<h1 class="side-title" style="top:178px;font-size:${size}px"><span class="line">${block.title[0]}</span><span class="line blue">${block.title[1]}</span></h1>`
      : `<h1 class="wide-title">${block.title[0]}<span class="blue">${block.title[1]}</span></h1>`;
    const steps = (block, icons) => block.steps.map((text,i)=>`<div class="feature-row"><i>${icon(icons[i])}</i><span>${text}</span></div>`).join('');
    const backupWidth = Math.min(610, Math.floor(621*backupRect.width/backupRect.height)+2);
    const backupHeight = Math.round((backupWidth-2)*backupRect.height/backupRect.width)+2;
    const backupTop = backupHeight > 610 ? 112 : 130;
    const syncNoticeTop = Math.max(572, Math.ceil(176+620*(fieldsRect.y-syncRect.y-12)/syncRect.width+26));
    const slides = [
      {
        file:'01-workspace', title:config.overview.title.join(''),
        html:`<main class="slide">${brand(1)}
          ${title(config.overview)}
          <p class="sub">${config.overview.sub}</p>
          <div class="frame" style="position:absolute;left:48px;top:211px;width:1184px;height:537px"><img src="${assets.workspace}" style="height:100%;object-fit:cover;object-position:top"></div>
          ${featureFooter(config.overview,['lock','check','globe'])}
        </main>`
      },
      {
        file:'02-drag-to-save', title:config.drag.title.join(' '),
        html:`<main class="slide dark">${brand(2)}
          <div class="eyebrow" style="position:absolute;left:50px;top:134px;width:400px;white-space:nowrap">${config.drag.eyebrow}</div>
          ${title(config.drag,true)}
          <p class="sub side-sub" style="top:331px;width:360px;font-size:21px">${config.drag.sub.join('<br>')}</p>
          <div style="position:absolute;left:50px;top:451px;width:365px;display:grid;gap:21px">
            ${steps(config.drag,['tab','folder','check'])}
          </div>
          <div class="frame" style="position:absolute;left:460px;top:179px;width:772px;height:508px"><img src="${assets.drag}" style="height:100%;object-fit:cover;object-position:top left"></div>
          <svg style="position:absolute;left:460px;top:179px;width:772px;height:508px;pointer-events:none" viewBox="0 0 640 420" fill="none"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto"><path d="m1 1 6 3-6 3" stroke="#2268f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></marker></defs><path d="${arrowPath}" stroke="white" stroke-width="9" stroke-linecap="round"/><path d="${arrowPath}" stroke="#2268f5" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="8 7" marker-end="url(#arrow)"/></svg>
          ${featureFooter(config.drag,['lock','folder'])}
        </main>`
      },
      {
        file:'03-themes', title:config.themes.title.join(''),
        html:`<main class="slide">${brand(3)}
          ${title(config.themes)}
          <p class="sub">${config.themes.sub}</p>
          ${['theme-light','theme-dark','theme-glass'].map((name,i)=>`
            <div class="frame" style="position:absolute;left:${48+i*403}px;top:220px;width:378px;height:497px">
              <img src="${assets[name]}" style="height:424px;object-fit:cover;object-position:top">
              <div style="padding:14px 18px;border-top:1px solid #e3e9f1"><b class="theme-label">${config.themes.labels[i]}</b><p class="theme-description">${config.themes.descriptions[i]}</p></div>
            </div>`).join('')}
          ${featureFooter(config.themes,['check','check','check'])}
        </main>`
      },
      {
        file:'04-local-and-backup', title:config.backup.title.join(' '),
        html:`<main class="slide">${brand(4)}
          <div class="eyebrow" style="position:absolute;left:50px;top:140px;width:500px;white-space:nowrap">${config.backup.eyebrow}</div>
          ${title(config.backup,true,59)}
          <p class="sub side-sub" style="top:334px;font-size:22px;width:485px">${config.backup.sub.join('<br>')}</p>
          <div style="position:absolute;left:50px;top:447px;width:510px;display:grid;gap:23px">
            ${steps(config.backup,['check','download','folder'])}
          </div>
          <div class="frame" style="position:absolute;left:${1232-backupWidth}px;top:${backupTop}px;width:${backupWidth}px;height:${backupHeight}px;border-radius:20px"><img src="${assets.backup}" style="height:100%;object-fit:cover"></div>
          ${featureFooter(config.backup,['lock','download'])}
        </main>`
      },
      {
        file:'05-optional-sync', title:config.sync.title.join(' '),
        html:`<main class="slide dark">${brand(5)}
          <div class="eyebrow" style="position:absolute;left:50px;top:140px;width:500px;white-space:nowrap">${config.sync.eyebrow}</div>
          ${title(config.sync,true,62)}
          <p class="sub side-sub" style="top:340px;font-size:22px;width:480px">${config.sync.sub.join('<br>')}</p>
          <div style="position:absolute;left:50px;top:463px;width:480px;display:grid;grid-template-columns:1fr 1fr;gap:13px">
            ${['GitHub Gist','Upstash Redis','Cloudflare KV','JSONBin',config.sync.custom].map((provider,i)=>`<div class="provider"><span style="width:7px;height:7px;background:${['#9cb6ff','#6cdbc0','#eeb988','#c1b1f6','#89c9ee'][i]};border-radius:50%;flex:none"></span><span>${provider}</span></div>`).join('')}
          </div>
          <div class="frame" style="position:absolute;left:610px;top:176px;width:622px;border-radius:20px"><img src="${assets['sync-choice']}"></div>
          <div class="sync-notice" style="position:absolute;left:632px;top:${syncNoticeTop}px;width:578px;display:flex;gap:17px;align-items:center;border-top:1px solid #3a526c;padding-top:27px">
            <span style="color:#68d6dd;flex:none">${icon('lock',38)}</span><div style="min-width:0"><b class="notice-title" style="font-size:22px;white-space:nowrap">${config.sync.notice}</b><p style="margin:7px 0 0;font-size:17px;line-height:1.35;color:#afc2da">${config.sync.detail}</p></div>
          </div>
          ${featureFooter(config.sync,['check','lock'])}
        </main>`
      }
    ];
    await viewport(1280,800);
    const layoutChecks = [];
    for (const slide of slides) {
      const html=`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${slide.title}</title><style>${common}</style></head><body>${slide.html}</body></html>`;
      await writeFile(path.join(here,slide.file+'.html'),html);
      await send('Page.navigate',{url:base + '/@fs/' + path.join(here,slide.file+'.html').replaceAll('\\','/')});
      for(let i=0;i<80;i++) {
        if(await evaluate("document.querySelector('.slide') && [...document.images].every(i => i.complete && i.naturalWidth > 0)")) break;
        await delay(100);
      }
      await evaluate('document.fonts.ready');
      const fitted = await evaluate(`(() => {
        const changes=[];
        const fit=(el,min,overflows) => {
          const initial=parseFloat(getComputedStyle(el).fontSize);
          let size=initial;
          while(overflows() && size>min) { size-=.5;el.style.fontSize=size+'px'; }
          if(size!==initial) changes.push({text:el.textContent,from:initial,to:size});
        };
        document.querySelectorAll('.wide-title').forEach(el=>fit(el,36,()=>el.scrollWidth>el.clientWidth));
        document.querySelectorAll('.side-title').forEach(el=>fit(el,34,()=>[...el.children].some(line=>line.scrollWidth>el.clientWidth) || el.getBoundingClientRect().height>136));
        document.querySelectorAll('.side-sub').forEach(el=>fit(el,18,()=>el.scrollHeight>86));
        document.querySelectorAll('.feature-row>span,.theme-label,.theme-description,.provider>span:last-child,.eyebrow,.notice-title').forEach(el=>fit(el,12,()=>el.scrollWidth>el.clientWidth));
        const foot=document.querySelector('.foot');
        if(foot) {
          let size=14;
          const a=foot.querySelector('.features'),b=foot.querySelector('.tag');
          while(a.getBoundingClientRect().right+20>b.getBoundingClientRect().left && size>11) {
            size-=.5;a.style.fontSize=size+'px';
          }
        }
        return changes;
      })()`);
      const overflow=await evaluate(`(() => {
        const els=[...document.querySelectorAll('h1,.sub,.feature-row,.series,.foot,.frame,.side-title .line,.theme-description,.notice-title')];
        return els.filter(el => el.scrollWidth > el.clientWidth + 2).map(el => ({text:el.textContent,scroll:el.scrollWidth,width:el.clientWidth}));
      })()`);
      if(overflow.length) throw new Error('Text overflow in '+slide.file+': '+JSON.stringify(overflow));
      const overlaps=await evaluate(`(() => {
        const errors=[];
        const h=document.querySelector('h1').getBoundingClientRect();
        const p=document.querySelector('.sub').getBoundingClientRect();
        if(h.bottom>p.top-6) errors.push('Heading overlaps subtitle');
        if(document.querySelector('.side-sub') && p.bottom>431) errors.push('Subtitle extends into the feature list');
        const f=document.querySelector('.foot');
        if(f.querySelector('.features').getBoundingClientRect().right+12>f.querySelector('.tag').getBoundingClientRect().left) errors.push('Footer columns overlap');
        const n=document.querySelector('.sync-notice');
        if(n && n.getBoundingClientRect().bottom>742) errors.push('Sync notice reaches footer');
        return errors;
      })()`);
      if(overlaps.length) throw new Error('Layout overlap in '+slide.file+': '+overlaps.join(', '));
      await writeFile(path.join(here,slide.file+'.html'),'<!doctype html>\n'+await evaluate('document.documentElement.outerHTML'));
      const result=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(path.join(output,slide.file+'.png'),Buffer.from(result.data,'base64'));
      layoutChecks.push({file:slide.file+'.png',fitted,overflow,overlaps});
      console.log('Rendered',locale,slide.file+'.png');
    }
    // A compact visual index for review, kept out of the five upload images.
    const sheetImages=slides;
    const sheet=`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#e8edf5;font-family:'${config.font}','Segoe UI',sans-serif;padding:24px;color:#15243c}h1{font-size:22px;margin:0 0 20px}section{display:grid;grid-template-columns:repeat(2,640px);gap:22px 24px}article{margin:0}img{display:block;width:640px;height:400px;border-radius:8px}p{font-size:14px;margin:10px 0 0;font-weight:600}</style></head><body><h1>Tabvia · ${config.native} · 1280 × 800</h1><section>${sheetImages.map((s,i)=>`<article><img src="../${s.file}.png"><p>0${i+1} · ${s.title}</p></article>`).join('')}</section></body></html>`;
    await writeFile(path.join(here,'contact-sheet.html'),sheet);
    await viewport(1330,1480);
    await send('Page.navigate',{url:base + '/@fs/' + path.join(here,'contact-sheet.html').replaceAll('\\','/')});
    await delay(500);
    const sheetPng=await send('Page.captureScreenshot',{format:'png'});
    await writeFile(path.join(here,'contact-sheet.png'),Buffer.from(sheetPng.data,'base64'));
    await writeFile(path.join(here,'manifest.json'),JSON.stringify({
      locale,
      dimensions:{width:1280,height:800},
      screenshots:slides.map(s=>s.file+'.png'),
      source:'Real current Vue UI, isolated temporary browser, fictional demonstration records; editorial titles and drag arrow added outside the app.',
      sync:'Disabled throughout capture. No credentials or provider requests.',
      originals,
      layoutChecks
    },null,2)+'\n');
  }
  for (const name of originalNames) {
    const hash = createHash('sha256').update(await readFile(path.join(output, name))).digest('hex');
    if (hash !== originals[name]) throw new Error(`Original changed: ${name}`);
  }
  console.log(locale+': '+originalNames.length+' legacy originals preserved (SHA-256 verified).');
} finally {
  socket?.close();
  browser?.kill();
  await server?.close();
  // Delete only this script's own uniquely created disposable profile.
  await delay(300);
  if (path.dirname(profile) === tmpdir() && path.basename(profile).startsWith('tabvia-store-'))
    await rm(profile, {recursive:true, force:true, maxRetries:5, retryDelay:200}).catch(() => {});
}
}
