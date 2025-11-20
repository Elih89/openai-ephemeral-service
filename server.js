// server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");        // we installed node-fetch@2
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------
// CORS
// --------------------
app.use(
  cors({
    origin: [
      process.env.ALLOWED_ORIGIN,          // e.g. https://shaterian.com
      "https://shaterian.com",
      "https://www.shaterian.com",
      "http://localhost:3000",             // optional for local testing
    ].filter(Boolean),
    methods: ["GET", "POST"],
  })
);

// For JSON bodies (ephemeral route)
app.use(express.json());

// --------------------
// Health check
// --------------------
app.get("/health", (_req, res) => res.json({ ok: true }));

// --------------------
// 1) Ephemeral token route (you already had this)
//    We’ll leave it in case you need it later.
// --------------------
app.post("/api/openai/ephemeral", async (_req, res) => {
  try {
    const model = "gpt-4o-realtime-preview";

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model,
        instructions:
          "You are my website voice assistant. Be concise and friendly.",
        modalities: ["audio", "text"],
        voice: "verse",
      }),
    });

    const text = await r.text();

    if (!r.ok) {
      console.error("Error creating session:", r.status, text);
      return res.status(r.status).json({ error: text });
    }

    const data = JSON.parse(text);
    res.json(data); // includes client_secret.value (ephemeral token)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error minting ephemeral token" });
  }
});

// --------------------
// 2) NEW: WebRTC signalling route
//    Browser sends SDP offer -> we forward to OpenAI -> return SDP answer
// --------------------
app.post(
  "/api/openai/webrtc-offer",
  express.text({ type: "*/*" }), // read raw SDP text from browser
  async (req, res) => {
    try {
      const sdpOffer = req.body;

      if (!sdpOffer || !sdpOffer.trim()) {
        return res.status(400).json({ error: "Missing SDP offer body" });
      }

      const apiResp = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // REAL key
            "Content-Type": "application/sdp",
            "OpenAI-Beta": "realtime=v1",
          },
          body: sdpOffer,
        }
      );

      const text = await apiResp.text();

      if (!apiResp.ok) {
        console.error("OpenAI SDP error:", apiResp.status, text);
        res.status(apiResp.status).send(text); // forward error back to browser
        return;
      }

      // Success: send SDP answer text back
      res.set("Content-Type", "application/sdp");
      res.send(text);
    } catch (err) {
      console.error("Server error talking to OpenAI:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// --------------------
// Start server
// --------------------
app.listen(PORT, () => {
  console.log(`Ephemeral service running on http://localhost:${PORT}`);
});
