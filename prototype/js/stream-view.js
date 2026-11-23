// ============================================================
// STREAM VIEW — everything the player sees during a stream.
// It listens to StreamEvent and draws; it never decides game rules.
// ============================================================

(function () {
  const USER_COLORS = ["--u1", "--u2", "--u3", "--u4", "--u5", "--u6"];
  const STAT_KEYS = ["followers", "money", "ego", "trust", "frustration"];

  function colorFor(name) {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `var(${USER_COLORS[h % USER_COLORS.length]})`;
  }

  function formatClock(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function signed(n) {
    return n > 0 ? `+${n}` : `${n}`;
  }

  class StreamView {
    constructor(state, config, assets) {
      this.state = state;
      this.cfg = config;
      this.$ = (id) => document.getElementById(id);
      this.chatList = this.$("chat-list");
      this.bill = this.$("bill");
      this.caption = this.$("caption");
      this.items = new Map(); // chat id -> { li, bar, chat }
      this.onDelete = null;
      this.onStart = null;

      this.applyAssets(assets || {});
      this.$("start-button").addEventListener("click", () => this.onStart && this.onStart());
      this.$("again-button").addEventListener("click", () => this.onStart && this.onStart());
      this.chatList.addEventListener("click", (e) => {
        const row = e.target.closest(".chat-row");
        if (row && this.onDelete) this.onDelete(Number(row.dataset.id));
      });

      state.onChange((stats, changed) => this.renderStats(changed));
      this.renderStats({});
      this.renderSlot();
      this.setMood();
    }

    // Build Bill from his sprites, and swap in a background if there is one.
    applyAssets(assets) {
      applyUiSkin(assets.ui);
      const win = this.$("game-window");
      this.$("fullscreen-button").addEventListener("click", () => {
        try {
          if (document.fullscreenElement) document.exitFullscreen();
          else win.requestFullscreen().catch(() => {});
        } catch (e) { /* fullscreen not available here */ }
      });
      const q = (sel) => document.querySelector(sel);
      const layout = {
        area: q(".os-body"),
        header: q(".topbar"),
        row: q(".layout"),
        column: q(".stage-col"),
        stageWin: q(".stage-win"),
        below: [q(".progress"), q(".hud")],
        chat: q(".chat"),
      };
      this.rig = new StreamScene(this.$("bill-canvas"), this.$("stage"), assets.bill, assets.scene, this.cfg.bill, layout, this.cfg.layout);
    }

    setStartEnabled(on, label) {
      const btn = this.$("start-button");
      btn.disabled = !on;
      btn.textContent = on ? "Go live" : label || "Go live";
    }

    // Shows what was loaded from data/*.csv, and any problems found.
    showContentReport(report) {
      const box = this.$("content-report");
      box.replaceChildren();
      const add = (tag, text, cls) => {
        const el = document.createElement(tag);
        el.textContent = text;
        if (cls) el.className = cls;
        box.appendChild(el);
        return el;
      };
      if (report.error) {
        add("p", report.error, "report-error");
        this.$("start-button").textContent = "Can't load chat";
        return;
      }
      const c = report.counts;
      const types = Object.keys(this.cfg.chatMix).map((t) => `${c[t]} ${t}`).join(", ");
      add("p", `Loaded ${types} messages, ${c.usernames} usernames, ${c.lines} lines.`);
      if (report.problems.length) {
        const list = add("ul", "", "report-problems");
        for (const problem of report.problems) {
          const li = document.createElement("li");
          li.textContent = problem;
          list.appendChild(li);
        }
      }
    }

    renderSlot() {
      this.$("slot-label").textContent = `Day ${this.state.day} · ${this.state.slotName}`;
    }

    renderStats(changed) {
      const stats = this.state.stats;
      for (const key of STAT_KEYS) {
        const el = this.$(`stat-${key}`);
        if (!el) continue;
        el.textContent = key === "money" ? `$${stats[key]}` : stats[key].toLocaleString();
        if (changed[key]) {
          const box = el.closest(".stat");
          box.classList.remove("bump-up", "bump-down");
          void box.offsetWidth; // restart the animation
          box.classList.add(changed[key] > 0 ? "bump-up" : "bump-down");
        }
      }
      const fr = this.$("frustration-fill");
      if (fr) fr.style.width = `${stats.frustration}%`;
      this.$("viewers").textContent = `${stats.followers.toLocaleString()} followers`;
      this.setMood();
    }

    setMood() {
      const f = this.state.stats.frustration;
      const m = this.cfg.moods;
      const mood = f >= m.furiousAt ? "furious" : f >= m.annoyedAt ? "annoyed" : "smug";
      this.bill.dataset.mood = mood;
    }

    reset() {
      this.items.clear();
      this.chatList.replaceChildren();
      this.caption.textContent = "";
      this.caption.hidden = true;
      this.$("start-screen").hidden = true;
      this.$("results-screen").hidden = true;
      this.$("progress-fill").style.width = "0%";
      this.$("chat-empty").hidden = false;
    }

    handle(type, data) {
      switch (type) {
        case "start": return this.onStreamStart(data);
        case "line": return this.showLine(data);
        case "chat": return this.addChat(data);
        case "read": return this.markRead(data.chat);
        case "deleted": return this.markDeleted(data);
        case "tick": return this.onTick(data);
        case "end": return this.showResults(data);
      }
    }

    onStreamStart({ duration }) {
      const badge = this.$("live-badge");
      badge.textContent = "LIVE";
      badge.classList.add("is-live");
      this.$("clock").textContent = formatClock(duration);
    }

    showLine(line) {
      this.caption.hidden = false;
      this.caption.textContent = line.text;
      this.caption.classList.remove("enter");
      void this.caption.offsetWidth;
      this.caption.classList.add("enter");
      this.rig.setTalking(true);
      clearTimeout(this.talkTimer);
      // Talk for most of the line, then pause before the next one.
      this.talkTimer = setTimeout(() => this.rig.setTalking(false), Math.min(line.seconds * 700, 3500));
    }

    addChat(chat) {
      this.$("chat-empty").hidden = true;
      const li = document.createElement("li");
      li.className = "chat-item is-live";
      li.innerHTML = `
        <button class="chat-row" type="button" data-id="${chat.id}" aria-label="Delete message from ${chat.user}">
          <span class="chat-user"></span><span class="chat-text"></span>
          <span class="chat-del" aria-hidden="true">Delete</span>
        </button>
        <span class="chat-timer" aria-hidden="true"><span></span></span>
        <span class="chat-tag" aria-hidden="true"></span>`;
      const user = li.querySelector(".chat-user");
      user.textContent = chat.user;
      user.style.color = colorFor(chat.user);
      li.querySelector(".chat-text").textContent = chat.text;
      this.chatList.appendChild(li);
      this.items.set(chat.id, { li, bar: li.querySelector(".chat-timer span"), chat });
      this.chatList.scrollTop = this.chatList.scrollHeight;
    }

    markRead(chat) {
      const item = this.items.get(chat.id);
      if (!item) return;
      item.li.classList.replace("is-live", "is-read");
      item.li.querySelector(".chat-row").disabled = true;
      item.li.querySelector(".chat-tag").textContent = "Seen by Bill";

      const { ego, frustration } = chat.effect;
      if (ego || frustration) {
        this.state.apply({ ego, frustration });
        this.pop(`${signed(ego)} Ego`, ego > 0 ? "good" : "bad");
        this.react(ego > 0 ? "pleased" : "hurt");
      }
    }

    markDeleted(chat) {
      const item = this.items.get(chat.id);
      if (!item) return;
      item.li.classList.replace("is-live", "is-deleted");
      item.li.querySelector(".chat-row").disabled = true;
      item.li.querySelector(".chat-text").textContent = "message deleted by a moderator";
    }

    onTick({ time, duration }) {
      this.$("clock").textContent = formatClock(duration - time);
      this.$("progress-fill").style.width = `${(time / duration) * 100}%`;
      const delay = this.cfg.stream.readDelaySeconds;
      for (const { bar, chat } of this.items.values()) {
        if (chat.status !== "live") continue;
        const left = Math.max(0, (chat.readAt - time) / delay);
        bar.style.transform = `scaleX(${left})`;
      }
    }

    pop(text, kind) {
      const el = document.createElement("div");
      el.className = `pop pop-${kind}`;
      el.textContent = text;
      el.style.left = `${38 + Math.random() * 24}%`;
      this.$("pop-layer").appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }

    react(kind) {
      this.rig.react(kind);
    }

    showResults(r) {
      clearTimeout(this.talkTimer);
      this.rig.setTalking(false);
      const badge = this.$("live-badge");
      badge.textContent = "OFFLINE";
      badge.classList.remove("is-live");
      this.$("clock").textContent = "0:00";
      this.$("progress-fill").style.width = "100%";

      const ego = this.$("result-ego");
      ego.textContent = signed(r.egoDelta);
      ego.dataset.tone = r.egoDelta > 0 ? "good" : r.egoDelta < 0 ? "bad" : "flat";

      this.$("result-verdict").textContent = this.verdict(r);
      this.$("result-caught").textContent = `${r.negativesCaught} of ${r.negativesTotal}`;
      this.$("result-missed").textContent = r.negativesMissed;
      this.$("result-frustration").textContent = signed(r.frustrationDelta);
      this.$("result-positive").textContent = r.positivesDeleted;
      this.$("result-neutral").textContent = r.neutralDeleted;
      this.$("result-range").textContent =
        `Perfect moderation: ${signed(r.bestPossibleEgo)} Ego · No moderation: ${signed(r.unmoderatedEgo)} Ego`;
      this.$("results-screen").hidden = false;
      this.$("again-button").focus();
    }

    verdict(r) {
      if (r.egoDelta === r.bestPossibleEgo) return "Flawless. Bill thinks the internet loves him.";
      if (r.negativesMissed === 0) return "No trolls got through, but you deleted some of his fans.";
      if (r.negativesMissed <= 2) return "A couple of trolls slipped through. Bill noticed.";
      return "Chat ate him alive. He's going to take it out on you.";
    }
  }

  window.StreamView = StreamView;
})();
