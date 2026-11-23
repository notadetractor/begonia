// ============================================================
// CONTENT LOADER — reads the spreadsheet (CSV) files in data/.
//
// You never need to edit this file to change what Bill or chat says.
// Edit the CSV files instead (see data/README.md).
//
// It returns the content plus a report of anything that looked wrong
// (a misspelled type, an empty message...). The report is shown on the
// start screen and in the browser console.
// ============================================================

(function () {
  // Turns CSV text into rows of cells. Handles quotes, commas and line
  // breaks inside quoted cells, and both Windows and Mac line endings.
  function parseCsv(text) {
    text = text.replace(/^﻿/, ""); // Excel adds an invisible marker at the start
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cell += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // Reads a CSV file into objects keyed by the header row, e.g. { type, message }.
  // Each object also remembers its spreadsheet row number for error messages.
  async function loadTable(path, requiredColumns, problems) {
    let text;
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      text = await res.text();
    } catch (e) {
      throw new Error(
        `Couldn't open ${path}. If you opened index.html straight from a folder, ` +
        `run it with VS Code's Live Server instead (see README.md).`
      );
    }
    const [header = [], ...body] = parseCsv(text);
    const columns = header.map((h) => h.trim().toLowerCase());
    for (const col of requiredColumns) {
      if (!columns.includes(col)) problems.push(`${path}: missing a "${col}" column in the first row.`);
    }
    const records = [];
    body.forEach((cells, i) => {
      if (cells.every((c) => c.trim() === "")) return; // skip blank rows
      const rec = { _row: i + 2 };
      columns.forEach((col, j) => { rec[col] = (cells[j] || "").trim(); });
      records.push(rec);
    });
    return records;
  }

  async function loadContent(files, chatTypes) {
    const problems = [];

    // --- Chat messages ---
    const messages = {};
    for (const type of chatTypes) messages[type] = [];
    for (const rec of await loadTable(files.chatMessages, ["type", "message"], problems)) {
      const type = rec.type.toLowerCase();
      if (!rec.message) { problems.push(`chat_messages.csv row ${rec._row}: the message is empty.`); continue; }
      if (!messages[type]) {
        problems.push(`chat_messages.csv row ${rec._row}: type "${rec.type}" isn't one of ${chatTypes.join(", ")}.`);
        continue;
      }
      messages[type].push(rec.message);
    }

    // --- Usernames ---
    const usernames = (await loadTable(files.chatUsernames, ["username"], problems))
      .map((rec) => rec.username)
      .filter(Boolean);
    if (!usernames.length) { problems.push("chat_usernames.csv has no usernames."); usernames.push("chatter"); }

    // --- Streamer script ---
    const lines = [];
    for (const rec of await loadTable(files.streamerScript, ["line"], problems)) {
      if (!rec.line) continue;
      const seconds = parseFloat(rec.seconds);
      if (rec.seconds && !(seconds > 0)) {
        problems.push(`streamer_script.csv row ${rec._row}: seconds "${rec.seconds}" isn't a number above 0, so it was ignored.`);
      }
      lines.push(seconds > 0 ? { text: rec.line, seconds } : rec.line);
    }
    if (!lines.length) problems.push("streamer_script.csv has no lines.");

    const counts = { usernames: usernames.length, lines: lines.length };
    for (const type of chatTypes) counts[type] = messages[type].length;

    problems.forEach((p) => console.warn(p));
    return { chatPool: { usernames, messages }, script: { lines }, counts, problems };
  }

  window.loadContent = loadContent;
})();
