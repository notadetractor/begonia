// ============================================================
// MAIN — loads the content, wires the pieces together and runs the game loop.
// ============================================================

(async function () {
  const state = new GameState(GAME_CONFIG.startingStats);
  const view = new StreamView(state, GAME_CONFIG, window.ASSET_MANIFEST);

  // Read chat messages, usernames and Bill's lines from the CSV files in data/.
  const chatTypes = Object.keys(GAME_CONFIG.chatMix);
  let content;
  try {
    view.setStartEnabled(false, "Loading chat…");
    content = await loadContent(GAME_CONFIG.content, chatTypes);
  } catch (err) {
    console.error(err);
    view.showContentReport({ error: err.message });
    return;
  }

  // Not an error, but worth knowing: too few messages means repeats in one stream.
  for (const type of chatTypes) {
    const need = GAME_CONFIG.chatMix[type].count;
    if (content.counts[type] < need) {
      content.problems.push(
        `Only ${content.counts[type]} ${type} messages, but each stream uses ${need}. Some will repeat.`
      );
    }
  }
  view.showContentReport(content);
  view.setStartEnabled(true);

  let stream = null;
  let lastFrame = 0;

  function startStream() {
    stream = new StreamEvent({
      config: GAME_CONFIG,
      script: content.script,
      chatPool: content.chatPool,
      onEvent: (type, data) => view.handle(type, data),
    });
    view.reset();
    stream.start();
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    // Cap the step so a hidden tab or a slow frame doesn't skip gameplay.
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    stream.update(dt);
    if (stream.running) requestAnimationFrame(loop);
  }

  view.onStart = startStream;
  view.onDelete = (id) => stream && stream.deleteChat(id);
})();
