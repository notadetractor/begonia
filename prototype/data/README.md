# Editing chat and Bill's lines

Everything Bill says and everything chat types lives in three spreadsheet files in this folder. You can change them without touching any code.

| File | What's in it | Columns |
|---|---|---|
| `chat_messages.csv` | The messages chat can send | `type`, `message`, `notes` |
| `chat_usernames.csv` | Names that chat messages are posted under | `username` |
| `streamer_script.csv` | Bill's lines, played top to bottom | `line`, `seconds` |

## What the columns mean

**chat_messages.csv**
- `type` must be exactly one of:
  - `positive`: praise. Raises Bill's Ego when he reads it. The player should leave these alone.
  - `neutral`: normal chat noise. No effect.
  - `negative`: trolling. Lowers Ego and raises Frustration. The player should delete these.
- `message` is the text that appears in chat. Emoji are fine.
- `notes` is for you. The game ignores it. Use it for where a message came from, ideas, or anything else.

You can add more columns of your own (for example `source` or `date_saved`). The game only reads the columns it knows.

**chat_usernames.csv**
- One name per row under `username`. Each stream shuffles them and assigns them to messages.

**streamer_script.csv**
- `line` is what Bill says. Lines play in order from top to bottom over the 60-second stream.
- `seconds` is optional. Leave it blank and the line gets an equal share of the leftover time. Put a number in to keep that line up for exactly that long.

## How many you need

Each stream uses **10 positive, 12 neutral and 6 negative** messages, picked at random from the file. You can have as many as you like; more means less repetition between streams. If a type has fewer than a stream needs, some messages repeat, and the start screen tells you.

Those numbers, and how much Ego each type is worth, are in `js/config.js` under `chatMix`.

## Editing the files

Use whichever program you like:

- **Excel**: open the file, edit, then **File → Save**. If Excel asks about keeping the format, choose **Keep Current Format** (CSV).
  If you use Save As, choose **CSV UTF-8 (Comma delimited)**. Plain "CSV" can break emoji and accented letters.
- **Google Sheets**: **File → Import** the file, edit, then **File → Download → Comma-separated values (.csv)**. Save it over the old file in this folder with the same name.
- **VS Code**: edit it as text. One row per line, cells separated by commas. A cell that contains a comma or a quote mark must be wrapped in quotes, and a quote inside it is written twice:
  `negative,"Bill, nobody ""likes"" you",`
  Spreadsheet programs add these quotes for you.

Keep the first row (the column names) as it is.

## Checking your changes

Run the game (see `../README.md`). The start screen shows what it loaded, for example:

> Loaded 12 positive, 16 neutral, 9 negative messages, 28 usernames, 11 lines.

If something is wrong, a list underneath says which file and which row, for example:

> chat_messages.csv row 39: type "postive" isn't one of positive, neutral, negative.

The row number matches the row number in Excel or Google Sheets. Bad rows are skipped; everything else still works.

## Saving to GitHub

When you're happy, commit the changed CSV files in GitHub Desktop and push. GitHub can display CSV files as tables, so you can check them on the website too.

## A note about real usernames and messages

This repo is public, so anything committed here can be seen by anyone. If you've collected real usernames or messages from a real chat, consider changing or anonymizing the usernames before committing them. They belong to real people who didn't agree to be in the game.
