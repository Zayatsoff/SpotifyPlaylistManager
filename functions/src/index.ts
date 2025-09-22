import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";

// Load local env when running emulator; safe no-op in production
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

// Bridge Firebase runtime config to environment variables expected by spotify-preview-finder
try {
  const spotifyCfg = (functions.config() as any)?.spotify || {};
  if (spotifyCfg.client_id && !process.env.SPOTIFY_CLIENT_ID) {
    process.env.SPOTIFY_CLIENT_ID = spotifyCfg.client_id;
  }
  if (spotifyCfg.client_secret && !process.env.SPOTIFY_CLIENT_SECRET) {
    process.env.SPOTIFY_CLIENT_SECRET = spotifyCfg.client_secret;
  }
} catch (_) {
  // functions.config() may not be available locally without emulators; ignore
}

const app = express();
app.use(cors({origin: true}));

app.get("/config", (req, res) => {
  const clientId = functions.config().spotify.client_id;
  const redirectUri = functions.config().spotify.redirect_uri;
  console.log(`Client ID: ${clientId}, Redirect URI: ${redirectUri}`);
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

exports.api = functions.https.onRequest(app);
