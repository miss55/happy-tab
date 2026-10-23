import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const extensionRoot = fileURLToPath(new URL("../apps/extension/", import.meta.url));
const require = createRequire(path.join(extensionRoot, "package.json"));
const viteRoot = path.dirname(require.resolve("vite/package.json"));
const { createServer } = await import(pathToFileURL(path.join(viteRoot, "dist/node/index.js")).href);
const candidates = process.env.CHROME_PATH ? [process.env.CHROME_PATH] : [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
];
let executable;
for (const candidate of candidates) {
  try { await access(candidate); executable = candidate; break; } catch { /* Try the next installation. */ }
}
if (!executable) throw new Error("Set CHROME_PATH to an installed Chrome or Chromium executable.");

const profile = await mkdtemp(path.join(tmpdir(), "tabvia-theme-"));
let server, browser, socket;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  server = await createServer({ root: extensionRoot, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  const appPort = server.httpServer.address().port;
  // A disposable profile prevents access to the user's browser or extension data.
  browser = spawn(executable, ["--headless", "--disable-gpu", "--no-first-run",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"],
  { windowsHide: true, stdio: "ignore" });
  let launchError;
  browser.on("error", (error) => { launchError = error; });
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (launchError) throw launchError;
    try { port = (await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; break; }
    catch { await delay(100); }
  }
  if (!port) throw new Error("Browser debugging endpoint did not start.");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const target = targets.find((item) => item.type === "page");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const commandId = ++id;
    const timer = setTimeout(() => { pending.delete(commandId); reject(new Error(`${method} timed out`)); }, 35000);
    pending.set(commandId, (message) => {
      clearTimeout(timer);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `http://127.0.0.1:${appPort}/tests/theme-styles.html` });
  let result;
  for (let attempt = 0; attempt < 150; attempt++) {
    await delay(200);
    const value = await send("Runtime.evaluate", {
      expression: "document.querySelector('#result')?.textContent", returnByValue: true
    });
    result = value.result?.value;
    if (result?.startsWith("PASS") || result?.startsWith("FAIL")) break;
  }
  if (!result?.startsWith("PASS")) throw new Error(result || "Theme checks did not finish.");
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result?.value;
  };
  await evaluate(`(async () => {
    document.querySelector('#theme-test-transitions').remove();
    const theme = await import('/src/services/theme.ts');
    await theme.setThemeStyle('soft'); await theme.setThemeMode('system');
    await theme.updateThemeEffects({animation: true});
  })()`);
  for (const mode of ["dark", "light"]) {
    await send("Emulation.setEmulatedMedia", { features: [
      { name: "prefers-color-scheme", value: mode },
      { name: "prefers-reduced-motion", value: "reduce" }
    ] });
    await delay(150);
    const state = await evaluate(`({mode: document.documentElement.dataset.themeMode,
      transition: getComputedStyle(document.querySelector('.theme-style-card')).transitionDuration})`);
    if (state.mode !== mode || state.transition !== "0s") throw new Error(`System preferences: ${JSON.stringify(state)}`);
  }
  await send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-color-scheme", value: "light" },
    { name: "prefers-reduced-motion", value: "no-preference" }
  ] });
  await evaluate("document.querySelector('.theme-style-card').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  const keyboard = await evaluate(`({selected: document.activeElement.getAttribute('aria-checked'),
    focusVisible: document.activeElement.matches(':focus-visible'),
    outline: getComputedStyle(document.activeElement).outlineStyle})`);
  if (keyboard.selected !== "true" || !keyboard.focusVisible || keyboard.outline !== "solid") throw new Error(`Keyboard focus: ${JSON.stringify(keyboard)}`);
  await evaluate("document.activeElement.blur()");
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 0, y: 0 });
  await delay(250);
  const hoverTarget = await evaluate(`(() => {
    const card = document.querySelector('.theme-style-card'); const rect = card.getBoundingClientRect();
    return {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, border: getComputedStyle(card).borderColor};
  })()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: hoverTarget.x, y: hoverTarget.y });
  await delay(200);
  const hover = await evaluate(`(() => { const card = document.querySelector('.theme-style-card'); return {
    hovered: card.matches(':hover'), border: getComputedStyle(card).borderColor,
    selected: card.getAttribute('aria-checked'), outline: getComputedStyle(card).outlineStyle
  }; })()`);
  if (!hover.hovered || hover.border === hoverTarget.border || hover.selected !== "false" || hover.outline !== "none") throw new Error(`Hover distinction: ${JSON.stringify(hover)}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 0, y: 0 });
  if (process.env.THEME_SCREENSHOT_DIR) {
    const directory = path.resolve(process.env.THEME_SCREENSHOT_DIR);
    await mkdir(directory, { recursive: true });
    await evaluate("document.querySelector('.theme-style-card[aria-checked=\"true\"]').focus()");
    // Restore keyboard modality after the pointer hover check.
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await delay(200);
    const focusScreenshot = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(path.join(directory, "keyboard-focus.png"), Buffer.from(focusScreenshot.data, "base64"));
    await evaluate("document.activeElement.blur()");
    for (const style of ["soft", "minimal", "glass", "fluent", "oled", "cyber"]) {
      for (const mode of ["light", "dark"]) {
        await evaluate(`(async () => {
          const theme = await import('/src/services/theme.ts');
          await theme.setThemeStyle('${style}'); await theme.setThemeMode('${mode}');
          await theme.setThemePalette('style'); await theme.updateThemeBackground({type: 'solid'});
          await theme.updateThemeEffects({blur: true, glow: false, animation: true});
          document.querySelector('.theme-dialog-scroll-area').scrollTop = 0;
        })()`);
        await delay(250);
        const screenshot = await send("Page.captureScreenshot", { format: "png" });
        await writeFile(path.join(directory, `${style}-${mode}.png`), Buffer.from(screenshot.data, "base64"));
      }
    }
    for (const type of ["gradient", "custom-image"]) {
      await evaluate(`(async () => {
        const theme = await import('/src/services/theme.ts');
        await theme.setThemeStyle('soft'); await theme.setThemeMode('light');
        await theme.updateThemeBackground({type: '${type}'});
        await theme.updateThemeEffects({blur: false});
        document.querySelector('.theme-background-settings').scrollIntoView({block: 'center'});
      })()`);
      await delay(250);
      const screenshot = await send("Page.captureScreenshot", { format: "png" });
      await writeFile(path.join(directory, `background-${type}.png`), Buffer.from(screenshot.data, "base64"));
    }
  }
  console.log(`${result}; system appearance, reduced motion, native keyboard focus and hover passed`);
} finally {
  socket?.close();
  browser?.kill();
  await server?.close();
  await delay(500);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}
