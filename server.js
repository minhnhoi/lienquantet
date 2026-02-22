const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const ROOT = process.cwd();
const PORT = 4000;

// auto-create data folder
const dataDir = path.join(ROOT, "data");
const entriesFile = path.join(dataDir, "entries.txt");
fs.mkdirSync(dataDir, { recursive: true });

// serve frontend
app.use(express.static(ROOT));
app.use(express.json({ limit: "200kb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// read all entries (latest first)
app.get("/api/entries", (req, res) => {
  if (!fs.existsSync(entriesFile)) return res.json({ items: [] });

  const lines = fs
    .readFileSync(entriesFile, "utf8")
    .split("\n")
    .filter(Boolean);

  const items = lines
    .map((line) => {
      // line format: timestamp \t text
      const [ts, ...rest] = line.split("\t");
      return { createdAt: Number(ts) || 0, text: rest.join("\t") };
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 500);

  res.json({ items });
});

// add entry
app.post("/api/entries", (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Text is required" });

    const entry = { createdAt: Date.now(), text };
    const line = `${entry.createdAt}\t${entry.text.replace(/\r?\n/g, "\\n")}\n`;

    fs.appendFileSync(entriesFile, line, "utf8");
    res.json({ entry });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));