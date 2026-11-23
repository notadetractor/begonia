// ============================================================
// GAME CONFIG — all the tuning numbers live here.
// Change values in this file to rebalance the game.
// ============================================================

window.GAME_CONFIG = {
  // Where the game reads its words from. Edit these files in Excel,
  // Google Sheets or VS Code; see data/README.md.
  content: {
    chatMessages: "data/chat_messages.csv",
    chatUsernames: "data/chat_usernames.csv",
    streamerScript: "data/streamer_script.csv",
  },

  stream: {
    durationSeconds: 60,   // how long a stream lasts
    firstChatAt: 1.0,      // seconds before the first chat appears
    chatIntervalMin: 1.5,  // shortest gap between chat messages (seconds)
    chatIntervalMax: 2.0,  // longest gap between chat messages (seconds)
    readDelaySeconds: 3.5, // how long you have to delete a message before Bill reads it
  },

  // How many of each kind of message appear per stream, and what each one
  // does when Bill reads it. Deleted messages have no effect.
  // The names (positive, neutral, negative) are the values allowed in the
  // "type" column of data/chat_messages.csv.
  //
  // With these numbers:
  //   10 positive x +10 ego  = +100 ego (the best possible stream)
  //    6 negative x -25 ego  = -150 ego
  //   If nobody moderates, the stream nets 100 - 150 = -50 ego.
  //
  // Keep (count x average gap) + firstChatAt + readDelaySeconds under
  // durationSeconds, or the last messages get read at the very end.
  chatMix: {
    positive: { count: 10, ego: 10,  frustration: 0 },
    neutral:  { count: 12, ego: 0,   frustration: 0 },
    negative: { count: 6,  ego: -25, frustration: 15 },
  },

  // Bill's stats at the start of the game. Only Ego and Frustration change
  // during a stream right now; the others are here for later systems.
  startingStats: {
    followers: 1204,
    money: 37,
    ego: 50,
    trust: 0,
    frustration: 0,
  },

  // Screen layout. The stream window is sized to fit the room art; the chat
  // panel gets the leftover width, within these limits (in screen pixels).
  layout: {
    chatMinWidth: 300,
    chatMaxWidth: 420,
    // The room is scaled by whole numbers (2x, 3x) when that fills at least
    // this share of the available space; otherwise it uses an in-between
    // scale so it isn't tiny. 1 = always fill exactly; 0 = always whole numbers.
    minWholeScaleFill: 0.75,
  },

  // How Bill is drawn and animated.
  bill: {
    heightFraction: 0.85,   // how much of the stream window's height Bill can fill
    turnFrameSeconds: 0.3,  // how long each turn pose is held while talking
    // The pose Bill holds while he isn't talking.
    idleFrame: { pose: "front", flip: false },
    // Poses cycled while he talks. flip: true mirrors the sprite (faces left).
    turnSequence: [
      { pose: "front", flip: false },
      { pose: "threeQuarter", flip: false },
      { pose: "front", flip: false },
      { pose: "threeQuarter", flip: true },
    ],
  },

  // Frustration thresholds that change Bill's face.
  moods: {
    annoyedAt: 25,
    furiousAt: 60,
  },
};
