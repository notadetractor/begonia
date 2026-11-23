// ============================================================
// STREAM SCENE — draws Bill's room and Bill onto one canvas.
//
// The room is a stack of same-sized layers (js/assets.js -> scene).
// Bill is drawn into the stack at the { bill: true } marker, built from his
// own layers (chair, body, head) for the current pose.
//
// Everything is scaled up by whole numbers only (2x, 3x, 4x...) so every
// art pixel stays a crisp square. While Bill talks, he steps through the
// turn sequence from config.js so he swivels side to side in his chair.
// ============================================================

(function () {
  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Couldn't load image "${src}". Check the path in js/assets.js.`);
        resolve(null);
      };
      img.src = src;
    });
  }

  const REACTIONS = {
    // Small offsets (in art pixels) applied to Bill over a short time.
    pleased: { seconds: 0.5, offset: (t) => ({ x: 0, y: t < 0.5 ? -1 : 0 }) },
    hurt: { seconds: 0.45, offset: (t) => ({ x: [-2, 2, -1, 1, 0][Math.floor(t * 5)] || 0, y: 0 }) },
  };

  class StreamScene {
    constructor(canvas, stage, billManifest, sceneManifest, animConfig, layout, layoutConfig) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.stage = stage;
      this.bill = billManifest;
      this.scene = sceneManifest;
      this.anim = animConfig;
      this.layout = layout; // page elements used to size the stream window
      this.layoutConfig = layoutConfig;
      this.talking = false;
      this.frameIndex = 0;
      this.frameTime = 0;
      this.reaction = null;
      this.drawnKey = null;
      this.last = 0;

      this.ready = this.load().then(() => {
        this.fit();
        const observer = new ResizeObserver(() => this.fit());
        observer.observe(layout.area);
        observer.observe(layout.header);
        requestAnimationFrame((t) => this.loop(t));
      });
    }

    async load() {
      this.billImages = {};
      for (const [pose, layers] of Object.entries(this.bill.poses)) {
        this.billImages[pose] = [];
        for (const name of this.bill.layerOrder) this.billImages[pose].push(await loadImage(layers[name]));
      }
      this.sceneLayers = [];
      for (const layer of this.scene.layers) {
        this.sceneLayers.push(typeof layer === "string" ? await loadImage(layer) : layer);
      }
    }

    // Size the stream window to fit the room art exactly, as big as the
    // game window allows, using a whole-number scale so pixels stay crisp.
    // Also sets the chat width and the shared column width (see style.css).
    fit() {
      const L = this.layout;
      const root = document.documentElement.style;
      const dpr = window.devicePixelRatio || 1;
      const W = this.scene.width;
      const H = this.scene.height;

      const areaStyle = getComputedStyle(L.area);
      const innerW = L.area.clientWidth - parseFloat(areaStyle.paddingLeft) - parseFloat(areaStyle.paddingRight);
      const innerH = L.area.clientHeight - parseFloat(areaStyle.paddingTop) - parseFloat(areaStyle.paddingBottom);
      const areaGap = parseFloat(areaStyle.rowGap) || 0;
      const rowGap = parseFloat(getComputedStyle(L.row).columnGap) || 0;
      const colGap = parseFloat(getComputedStyle(L.column).rowGap) || 0;

      // Border + padding around the stream picture.
      const ws = getComputedStyle(L.stageWin);
      const px = (...props) => props.reduce((sum, prop) => sum + (parseFloat(ws[prop]) || 0), 0);
      const chromeW = px("borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight");
      const chromeH = px("borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom");
      // Everything stacked under the stream window (progress bar, stats).
      const belowH = L.below.reduce((sum, el) => sum + el.offsetHeight + colGap, 0);
      // On narrow screens the chat drops below the stream instead of beside it.
      const stacked = L.chat.offsetTop > L.stageWin.offsetTop + 10;

      const availW = innerW - chromeW - (stacked ? 0 : rowGap + this.layoutConfig.chatMinWidth);
      const availH = stacked ? Infinity : innerH - L.header.offsetHeight - areaGap - belowH - chromeH;

      // Prefer a whole-number scale (crisp pixels). If that would leave the
      // room much smaller than the space allows, use the best fit instead.
      const best = Math.max(0.1, Math.min((availW * dpr) / W, (availH * dpr) / H));
      const whole = Math.floor(best);
      this.scale = whole >= 1 && whole >= best * this.layoutConfig.minWholeScaleFill ? whole : best;
      const cssW = Math.floor(W * this.scale) / dpr;
      const cssH = Math.floor(H * this.scale) / dpr;

      root.setProperty("--stage-w", `${cssW}px`);
      root.setProperty("--stage-h", `${cssH}px`);
      if (stacked) {
        root.removeProperty("--chat-w");
        root.removeProperty("--content-w");
      } else {
        const stageColW = cssW + chromeW;
        const { chatMinWidth, chatMaxWidth } = this.layoutConfig;
        const chatW = Math.max(chatMinWidth, Math.min(chatMaxWidth, innerW - stageColW - rowGap));
        root.setProperty("--chat-w", `${chatW}px`);
        root.setProperty("--content-w", `${stageColW + rowGap + chatW}px`);
      }

      this.canvas.width = Math.round(cssW * dpr);
      this.canvas.height = Math.round(cssH * dpr);
      this.originX = 0;
      this.originY = 0;
      this.drawnKey = null; // force a redraw
      this.draw();
    }

    setTalking(on) {
      if (on === this.talking) return;
      this.talking = on;
      this.frameIndex = 0;
      this.frameTime = 0;
      this.draw();
    }

    react(kind) {
      if (REACTIONS[kind]) this.reaction = { kind, t: 0 };
    }

    currentFrame() {
      if (!this.talking) return this.anim.idleFrame;
      const seq = this.anim.turnSequence;
      return seq[this.frameIndex % seq.length];
    }

    billOffset() {
      if (!this.reaction) return { x: 0, y: 0 };
      return REACTIONS[this.reaction.kind].offset(this.reaction.t);
    }

    loop(now) {
      const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
      this.last = now;
      if (this.talking) {
        this.frameTime += dt;
        if (this.frameTime >= this.anim.turnFrameSeconds) {
          this.frameTime -= this.anim.turnFrameSeconds;
          this.frameIndex += 1;
        }
      }
      if (this.reaction) {
        this.reaction.t += dt;
        if (this.reaction.t >= REACTIONS[this.reaction.kind].seconds) this.reaction = null;
      }
      this.draw();
      requestAnimationFrame((t) => this.loop(t));
    }

    draw() {
      if (!this.sceneLayers || !this.scale) return;
      const frame = this.currentFrame();
      const off = this.billOffset();
      const key = `${frame.pose}|${frame.flip}|${off.x},${off.y}|${this.canvas.width}x${this.canvas.height}`;
      if (key === this.drawnKey) return; // nothing changed since last draw
      this.drawnKey = key;

      const ctx = this.ctx;
      const s = this.scale;
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.scene.edgeColor || "#000";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const sw = this.scene.width * s;
      const sh = this.scene.height * s;
      for (const layer of this.sceneLayers) {
        if (!layer) continue;
        if (layer.bill) this.drawBill(frame, off);
        else ctx.drawImage(layer, this.originX, this.originY, sw, sh);
      }
    }

    drawBill(frame, off) {
      const ctx = this.ctx;
      const s = this.scale;
      const size = this.bill.frameSize * s;
      const x = this.originX + (this.scene.billPosition.x + off.x) * s;
      const y = this.originY + (this.scene.billPosition.y + off.y) * s;
      ctx.save();
      if (frame.flip) {
        ctx.translate(x + size, y);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(x, y);
      }
      for (const img of this.billImages[frame.pose] || []) {
        if (img) ctx.drawImage(img, 0, 0, size, size);
      }
      ctx.restore();
    }
  }

  window.StreamScene = StreamScene;
})();
