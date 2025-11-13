import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/openai/ephemeral", async (req, res) => {
  try {
    const tokenResponse = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview",
          modalities: ["audio", "text"]
        })
      }
    );

    const json = await tokenResponse.json();
    return res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error minting ephemeral token" });
  }
});

// Render uses its own PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
