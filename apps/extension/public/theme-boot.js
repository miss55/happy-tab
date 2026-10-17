// A disposable paint hint, never the source of truth for theme settings.
// Keep this parser-blocking script local and independent of the Vue bundle.
(() => {
  try {
    const snapshot = JSON.parse(localStorage.getItem("tabvia_theme_paint_v1") || "null");
    if (!snapshot || snapshot.version !== 1 || !["light", "dark"].includes(snapshot.mode)) return;
    const root = document.documentElement;
    const forcedDark = ["cyber", "oled"].includes(snapshot.style);
    const mode = snapshot.modeSetting === "system" && !forcedDark
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : snapshot.mode;
    const color = mode === snapshot.mode && typeof snapshot.baseColor === "string"
      && snapshot.baseColor.length < 100 && CSS.supports("color", snapshot.baseColor)
      ? snapshot.baseColor : mode === "dark" ? "#0b1120" : "#f5f7fb";
    root.style.backgroundColor = color;
    root.style.colorScheme = mode;
    root.style.setProperty("--theme-bg", color);
    root.dataset.theme = mode;
    root.dataset.themeMode = mode;
    if (["soft", "minimal", "glass", "fluent", "cyber", "oled"].includes(snapshot.style)) {
      root.dataset.themeStyle = snapshot.style;
    }
    // Only packaged wallpapers can survive navigation. Never persist blob URLs.
    if (typeof snapshot.wallpaper === "string") {
      const url = new URL(snapshot.wallpaper, location.href);
      if (url.protocol === location.protocol && url.host === location.host
        && /^\/(assets|src\/assets)\/[\w/.-]+\.webp$/.test(url.pathname)) {
        root.style.setProperty("--theme-background-image", `url("${url.href}")`);
        root.dataset.backgroundImage = "true";
        const preload = document.createElement("link");
        preload.rel = "preload";
        preload.as = "image";
        preload.href = url.href;
        document.head.append(preload);
      }
    }
    if (typeof snapshot.overlay === "number" && Number.isFinite(snapshot.overlay)) {
      root.style.setProperty("--theme-background-overlay", String(Math.max(0, Math.min(1, snapshot.overlay))));
    }
  } catch {
    // Missing/corrupt/blocked cache must never prevent normal initialization.
  }
})();
