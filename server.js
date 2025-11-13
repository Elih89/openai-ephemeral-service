// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN, // e.g., https://your-wordpress-site.com
  methods: ["POST"]
}));

app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Ephemeral token route
app.post("/api/openai/ephemeral", async (_req, res) => {
  try {
    const model = "gpt-4o-realtime-preview"; // verify current realtime model name in docs

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: "You are my website voice assistant. Be concise and friendly.",
        modalities: ["audio", "text"],
        voice: "verse"
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json(); // includes client_secret.value (ephemeral token)
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error minting ephemeral token" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Ephemeral service running on http://localhost:${port}`);
});
