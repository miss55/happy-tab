import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../apps/extension/", import.meta.url));
const require = createRequire(path.join(root, "package.json"));
const { createServer } = await import(pathToFileURL(path.join(path.dirname(require.resolve("vite/package.json")), "dist/node/index.js")).href);
const candidates = process.env.CHROME_PATH ? [process.env.CHROME_PATH] : [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
];
let executable;
for (const candidate of candidates) { try { await access(candidate); executable = candidate; break; } catch { /* Next browser. */ } }
if (!executable) throw new Error("Set CHROME_PATH to an installed Chrome/Edge executable.");
const profile = await mkdtemp(path.join(tmpdir(), "tabvia-pages-"));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let server, browser, socket;
try {
  server = await createServer({ root, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  const port = server.httpServer.address().port;
  browser = spawn(executable, ["--headless", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let launchError;
  browser.on("error", error => { launchError = error; });
  let debugPort;
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError;
    try { debugPort = (await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; break; }
    catch { await delay(100); }
  }
  if (!debugPort) throw new Error("Browser did not start.");
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const current = ++id;
    const timer = setTimeout(() => { pending.delete(current); reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(current, message => { clearTimeout(timer); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result); });
    socket.send(JSON.stringify({ id: current, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result?.value;
  };
  await send("Emulation.setDeviceMetricsOverride", { width: 1560, height: 960, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/tests/bookmark-pages.html` });
  let result;
  for (let i = 0; i < 200; i++) {
    await delay(150);
    result = await evaluate("document.querySelector('#result')?.textContent");
    if (result?.startsWith("PASS") || result?.startsWith("FAIL")) break;
  }
  if (!result?.startsWith("PASS")) throw new Error(result || "Browser tests did not finish.");
  // The grid must not compress the toolbar below its two rows of content.
  // Check actual content bounds, including framed wallpaper themes and short windows.
  let toolbarChecks = 0;
  for (const [width, height] of [[1560, 640], [900, 960], [640, 960], [390, 960]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    for (const style of ["soft", "minimal", "glass", "fluent", "oled", "cyber"]) {
      for (const background of ["solid", "wallpaper"]) {
        await evaluate(`(async () => {
          const theme = await import('/src/services/theme.ts');
          const {setLocale} = await import('/src/i18n/index.ts');
          await setLocale('zh-CN');
          await theme.setThemeStyle('${style}'); await theme.setThemeMode('dark');
          await theme.updateThemeBackground({type: '${background}'});
          await theme.updateThemeEffects({animation: false});
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        })()`);
        const bounds = await evaluate(`(() => {
          const header = document.querySelector('.bookmark-section-header');
          const rect = header.getBoundingClientRect(), css = getComputedStyle(header);
          const top = rect.top + parseFloat(css.borderTopWidth) + parseFloat(css.paddingTop);
          const bottom = rect.bottom - parseFloat(css.borderBottomWidth) - parseFloat(css.paddingBottom);
          const content = [...header.querySelectorAll('.bookmark-page-bar, .bookmark-page-summary, .bookmark-create-trigger')].map(element => {
            const item = element.getBoundingClientRect();
            return {name: element.className, top: item.top, bottom: item.bottom, fits: item.top >= top - .5 && item.bottom <= bottom + .5};
          });
          return {height: rect.height, top, bottom, content, cardsBelow: document.querySelector('.link-groups').getBoundingClientRect().top >= rect.bottom};
        })()`);
        if (!bounds.content.every(item => item.fits) || !bounds.cardsBelow) {
          throw new Error(`Bookmark toolbar overflow ${width}x${height}/${style}/${background}: ${JSON.stringify(bounds)}`);
        }
        toolbarChecks++;
      }
    }
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1560, height: 960, deviceScaleFactor: 1, mobile: false });
  let pageThemeChecks = 0;
  for (const style of ["soft", "minimal", "glass", "fluent", "oled", "cyber"]) {
    for (const mode of ["light", "dark"]) {
      await evaluate(`(async () => {
        const theme = await import('/src/services/theme.ts');
        await theme.setThemeStyle('${style}'); await theme.setThemeMode('${mode}');
        await theme.updateThemeBackground({type: 'solid'});
        await theme.updateThemeEffects({animation: false, blur: true});
        document.querySelector('.bookmark-page-item.active .bookmark-page-menu').click();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      })()`);
      await delay(50);
      const appearance = await evaluate(`(() => {
        const editor = document.querySelector('.bookmark-page-editor');
        const primary = getComputedStyle(editor.querySelector('button[type="submit"]'));
        const secondary = getComputedStyle(editor.querySelector('.secondary-form-button'));
        const header = getComputedStyle(document.querySelector('.bookmark-section-header'));
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;visibility:hidden;background:var(--theme-accent);color:var(--theme-accent-contrast);border-radius:var(--theme-radius-sm)';
        document.body.append(probe);
        const expected = getComputedStyle(probe);
        const primaryMatches = primary.backgroundColor === expected.backgroundColor && primary.color === expected.color && primary.borderRadius === expected.borderRadius && primary.borderTopStyle === 'solid';
        const secondaryProbe = document.createElement('span');
        secondaryProbe.style.cssText = 'position:absolute;visibility:hidden;background:var(--theme-surface);color:var(--theme-surface-text);border-radius:var(--theme-radius-sm)';
        document.body.append(secondaryProbe);
        const expectedSecondary = getComputedStyle(secondaryProbe);
        const secondaryMatches = secondary.backgroundColor === expectedSecondary.backgroundColor && secondary.color === expectedSecondary.color && secondary.borderRadius === expectedSecondary.borderRadius;
        const secondaryExpected = {background: expectedSecondary.backgroundColor, color: expectedSecondary.color, radius: expectedSecondary.borderRadius};
        probe.remove(); secondaryProbe.remove();
        const input = editor.querySelector('input'), rect = input.getBoundingClientRect();
        return {primaryMatches, secondaryMatches, secondaryExpected, resolvedStyle: document.documentElement.dataset.themeStyle,
          secondary: {background: secondary.backgroundColor, color: secondary.color, radius: secondary.borderRadius},
          headerBackground: header.backgroundColor, headerBlur: header.backdropFilter,
          inputOnTop: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === input};
      })()`);
      const needsMaterial = style === 'glass' || style === 'fluent';
      if (!appearance.primaryMatches || !appearance.secondaryMatches || !appearance.inputOnTop ||
          (needsMaterial && (appearance.headerBackground === 'rgba(0, 0, 0, 0)' || appearance.headerBlur === 'none'))) {
        throw new Error(`Bookmark page theme ${style}/${mode}: ${JSON.stringify(appearance)}`);
      }
      await evaluate("document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}))");
      pageThemeChecks++;
    }
  }
  const screenshotPath = process.argv.find(arg => arg.startsWith("--screenshot="))?.slice("--screenshot=".length);
  if (screenshotPath) {
    await evaluate(`(async () => {
      const {setLocale} = await import('/src/i18n/index.ts');
      const theme = await import('/src/services/theme.ts');
      await setLocale('zh-CN'); await theme.setThemeStyle('cyber'); await theme.setThemeMode('dark');
      document.querySelector('.saved-links-column').scrollTop = 0;
    })()`);
    await delay(250);
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
  }
  await evaluate("location.href = '/'");
  let restored = false;
  for (let i = 0; i < 100; i++) {
    await delay(100);
    restored = await evaluate("document.querySelector('.bookmark-page-tab[aria-selected=true]')?.textContent.trim() === 'Work & research'");
    if (restored) break;
  }
  if (!restored) throw new Error("Reload did not restore the selected page.");
  console.log(`${result}; ${toolbarChecks} toolbar containment checks; ${pageThemeChecks} page theme checks; reload restores page`);
} finally {
  socket?.close(); browser?.kill(); await server?.close(); await delay(500);
  // Only remove the verified disposable profile created by this script.
  if (path.dirname(profile) !== path.resolve(tmpdir()) || !path.basename(profile).startsWith("tabvia-pages-")) throw new Error("Unexpected profile path");
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}
