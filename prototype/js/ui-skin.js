// ============================================================
// UI SKIN — turns the window art in js/assets.js into CSS variables.
//
// The stylesheet uses these variables for every window border, so the
// art can be swapped by editing assets.js without touching the CSS.
//   --ui-px            art pixel size in screen pixels
//   --ui-title-left / --ui-title-middle / --ui-title-right
//   --ui-body-*        main window body (image, slice, widths)
//   --ui-frame-*       inner windows (image, slice, widths)
// ============================================================

(function () {
  function applyUiSkin(ui) {
    if (!ui) return;
    const root = document.documentElement.style;
    // Full URLs, because a relative path inside a CSS variable would be read
    // relative to the stylesheet (css/) instead of the page.
    const url = (path) => `url("${new URL(path, document.baseURI).href}")`;

    root.setProperty("--ui-title-left", url(ui.titlebarLeft));
    root.setProperty("--ui-title-middle", url(ui.titlebarMiddle));
    root.setProperty("--ui-title-right", url(ui.titlebarRight));

    for (const [name, def] of [["body", ui.windowBody], ["frame", ui.windowFrame]]) {
      const [t, r, b, l] = def.slice;
      root.setProperty(`--ui-${name}-image`, url(def.file));
      root.setProperty(`--ui-${name}-slice`, `${t} ${r} ${b} ${l} fill`);
      root.setProperty(`--ui-${name}-t`, t);
      root.setProperty(`--ui-${name}-r`, r);
      root.setProperty(`--ui-${name}-b`, b);
      root.setProperty(`--ui-${name}-l`, l);
    }

    // Whole-number pixel scale: full size on roomy screens, smaller on phones.
    const setScale = () => {
      const small = window.innerWidth < 700 || window.innerHeight < 560;
      const scale = small ? Math.max(1, ui.pixelScale - 1) : ui.pixelScale;
      root.setProperty("--ui-px", `${scale}px`);
    };
    setScale();
    window.addEventListener("resize", setScale);

    if (ui.cursor) applyCursor(ui.cursor);
  }

  // ---------- Hoof cursor ----------
  // Draws the cursor art enlarged with crisp pixels (sharp on high-resolution
  // screens too), then swaps to the "pressed" art while the mouse is held.
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Couldn't load cursor "${src}". Check the path in js/assets.js.`));
      img.src = src;
    });
  }

  function enlarge(img, factor) {
    const c = document.createElement("canvas");
    c.width = img.width * factor;
    c.height = img.height * factor;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  }

  async function cursorRule(def, scale) {
    const img = await loadImage(def.file);
    const [hx, hy] = def.hotspot.map((n) => Math.round(n * scale));
    const one = enlarge(img, scale);
    const two = enlarge(img, scale * 2);
    // The first value works everywhere; the second (sharper on high-res
    // screens) replaces it in browsers that support it.
    return `cursor: url("${one}") ${hx} ${hy}, auto;` +
      `cursor: image-set(url("${one}") 1x, url("${two}") 2x) ${hx} ${hy}, auto;` +
      `cursor: -webkit-image-set(url("${one}") 1x, url("${two}") 2x) ${hx} ${hy}, auto;`;
  }

  async function applyCursor(cursor) {
    try {
      const scale = cursor.scale || 1;
      const normal = await cursorRule(cursor.normal, scale);
      const pressed = cursor.pressed ? await cursorRule(cursor.pressed, scale) : normal;
      const style = document.createElement("style");
      style.textContent =
        `html { ${normal} }\n` +
        `html.hoof-down { ${pressed} }\n` +
        // Buttons and chat rows normally show a hand; use the hoof everywhere.
        `html *, html *::before, html *::after { cursor: inherit !important; }`;
      document.head.appendChild(style);

      const root = document.documentElement;
      const down = () => root.classList.add("hoof-down");
      const up = () => root.classList.remove("hoof-down");
      window.addEventListener("pointerdown", down);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      window.addEventListener("blur", up);
    } catch (err) {
      console.warn(err.message); // keep the normal cursor if the art is missing
    }
  }

  window.applyUiSkin = applyUiSkin;
})();
