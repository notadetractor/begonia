# SnarkGuyBill — Stream Prototype (HTML/JS)

A playable 60-second stream. You're Bill's moderator: delete the nasty chat messages before he reads them, and leave the compliments alone.

This is the **design prototype**: a quick place to try ideas and tune numbers. The full game is being built in Godot.

## Running it

The game reads its chat and script from spreadsheet files, which browsers only allow over a web server. So instead of double-clicking `index.html`:

1. Open the **whole repo folder** in VS Code (**File → Open Folder**).
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel. You only need to do this once.
3. Open `prototype/index.html` and click **Go Live** in the bottom-right corner of VS Code.

Your browser opens the game, and it reloads automatically whenever you save a file.

If you double-click `index.html` instead, the start screen tells you it can't load the chat. That's expected.

## What to edit

| File | What it controls |
|---|---|
| `data/chat_messages.csv` | What chat says, and whether each message is positive, neutral or negative |
| `data/chat_usernames.csv` | The names chat messages are posted under |
| `data/streamer_script.csv` | Everything Bill says during a stream |
| `js/config.js` | All the numbers: stream length, chat timing, ego per message, starting stats |
| `js/assets.js` | Which art file is used where, and the hoof cursor |

`data/README.md` explains the spreadsheet files step by step.

## Ego balance

Each stream uses a fixed number of messages from each type (`chatMix` in `js/config.js`), so the totals are always the same:

- 10 positive × +10 = **+100 Ego** if you moderate perfectly
- 6 negative × −25 = −150, so **−50 Ego** if nobody moderates

Only the order, the exact texts and the usernames are shuffled.

## How the code is organized

| File | Job |
|---|---|
| `js/content-loader.js` | Reads the CSV files in `data/` and reports mistakes. |
| `js/game-state.js` | Bill's stats and the Day Stream / Break / Night Stream calendar. |
| `js/stream-event.js` | The rules of a stream: chat schedule, read timer, deletion, results. No drawing. |
| `js/stream-view.js` | Draws the stream and reacts to events. No rules. |
| `js/stream-scene.js` | Draws the room and Bill, and sizes the stream window to fit the room. |
| `js/ui-skin.js` | Applies the window art and the hoof cursor. |
| `js/main.js` | Loads everything and runs the game loop. |

## Art

Files in `assets/` keep the artist's names, and their originals are in `../art-source/`. To update a piece of art, copy the new file from `art-source/` over the one in `assets/` with the same name.

- **Room:** `assets/backgrounds/bg_layer1.png`–`bg_layer6.png` (320×200 each), stacked back to front. Bill sits between layer 3 (side table) and layer 4 (desk), at `billPosition` in `js/assets.js`.
- **Bill:** stacked 64×64 layers: chair, then body, then head. Poses are `front`, `threeQuarter` (the artist's `side`/`34` files) and `profile`. While Bill talks, he swivels front → 3/4 → front → mirrored 3/4. Speed and order are in `js/config.js` under `bill`.
- **Window frame:** `assets/ui/titlebar_*.png` and `window_*.png` are cut from the artist's `window_1.png`. Their border sizes are in `js/assets.js` under `ui`.
- **Hoof cursor:** `piggycursorC1.png` normally, `piggycursorC2.png` while the mouse button is held. `hotspot` sets the exact pixel that clicks, and `scale` makes it bigger.
- Pixel art is always scaled by whole numbers (2×, 3×) when there's room, so pixels stay sharp.
