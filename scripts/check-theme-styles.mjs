import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
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
  console.log(result);
} finally {
  socket?.close();
  browser?.kill();
  await server?.close();
  await delay(500);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}
