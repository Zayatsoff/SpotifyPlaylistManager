import * as express from "express";
import * as cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

// Load local env when running emulator; safe no-op in production
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const app = express();
app.use(cors({origin: true}));

app.get("/config", (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "";
  console.log(`Client ID present: ${clientId ? "yes" : "no"}, Redirect URI present: ${redirectUri ? "yes" : "no"}`);
  res.json({clientId, redirectUri});
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const spotifyPreviewFinder = require("spotify-preview-finder");

// GET /preview?q=<song name> <artist>&limit=1
app.get("/preview", async (req, res) => {
  const q = (req.query.q as string) || "";
  const limitRaw = (req.query.limit as string) || "1";
  const limit = Math.max(1, Math.min(5, parseInt(limitRaw, 10) || 1));

  if (!q || !q.trim()) {
    res.status(400).json({error: "Missing required query parameter 'q' (e.g., 'Blinding Lights The Weeknd')"});
    return;
  }

  try {
    const result = await spotifyPreviewFinder(q, limit);
    if (!result || result.success !== true) {
      res.status(200).json({previewUrl: null, success: false});
      return;
    }
    const first = Array.isArray(result.results) ? result.results[0] : undefined;
    const previewUrl = first && Array.isArray(first.previewUrls) && first.previewUrls.length > 0 ? first.previewUrls[0] : null;
    res.json({previewUrl});
  } catch (e: any) {
    console.error("/preview error", e);
    res.status(500).json({error: e?.message || "Failed to resolve preview URL"});
  }
});

export const api = onRequest({
  region: "us-central1",
  cors: true,
  secrets: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REDIRECT_URI"],
}, app);
