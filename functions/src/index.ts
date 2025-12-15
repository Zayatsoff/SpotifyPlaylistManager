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

// POST /token - Exchange authorization code for access token (PKCE flow)
app.post("/token", async (req, res) => {
  const {code, code_verifier, redirect_uri} = req.body;

  if (!code || !code_verifier || !redirect_uri) {
    res.status(400).json({error: "Missing required parameters: code, code_verifier, redirect_uri"});
    return;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    console.error("Missing Spotify credentials in environment");
    res.status(500).json({error: "Server configuration error"});
    return;
  }

  try {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("code_verifier", code_verifier);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Spotify token exchange failed:", response.status, errorData);
      res.status(response.status).json({error: "Token exchange failed", details: errorData});
      return;
    }

    const tokenData = await response.json();
    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
    });
  } catch (e: any) {
    console.error("/token error", e);
    res.status(500).json({error: e?.message || "Failed to exchange authorization code"});
  }
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
