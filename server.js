import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const sessionConfig = JSON.stringify({
  session: {
    type: "realtime",
    model: "gpt-4o-realtime-preview",
    // you can tweak these later
    instructions: "You are my website voice assistant.",
    audio: {
      output: { voice: "verse" }
    }
  }
});

// This is the endpoint your browser will call
app.post("/api/openai/ephemeral", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: sessionConfig
      }
    );

    // If OpenAI returns an error, log it so we can see what's wrong
    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", response.status, text);
      return res
        .status(500)
        .json({ error: "OpenAI error", status: response.status, details: text });
    }

    const data = await response.json();
    // This includes client_secret.value (the ek_… token)
    return res.json(data);
  } catch (err) {
    console.error("Error minting ephemeral token:", err);
    return res
      .status(500)
      .json({ error: "Server error minting ephemeral token" });
  }
});

// Simple health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

