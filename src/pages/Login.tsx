import { Button } from "@/components/ui/button";
import ThemeToggler from "@/components/ui/ThemeToggler";
import { default as Logo } from "@/assets/spm_quick_logo_colour.svg?react";
import { default as SpotifyLogo } from "@/assets/spotify.svg?react";
import { getConfig } from "@/utils/getConfig";
import { useEffect, useState } from "react";

export default function Login() {
  const stateKey = "spotify_auth_state";
  const [config, setConfig] = useState({ clientId: "", redirectUri: "" });
  const [loading, setLoading] = useState(true);
  const isConfigReady = !!(config.clientId && config.redirectUri);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await getConfig();
        console.log("Login config loaded:", {
          clientId: configData.clientId ? "✓" : "✗",
          redirectUri: configData.redirectUri,
        });
        setConfig({
          clientId: configData.clientId,
          redirectUri: configData.redirectUri,
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch configuration:", error);
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const scope =
    "user-read-private playlist-read-collaborative playlist-read-private playlist-modify-private playlist-modify-public";

  const generateRandomString = (length: number) => {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  // Generate PKCE code verifier (random string)
  const generateCodeVerifier = () => {
    const length = 128;
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let text = "";
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  // Generate PKCE code challenge from verifier
  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    return base64;
  };

  const generateAuthUrl = async () => {
    const state = generateRandomString(16);
    localStorage.setItem(stateKey, state);

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier for later use in callback
    sessionStorage.setItem("spotify_code_verifier", codeVerifier);

    console.log("Generating auth URL with redirect_uri:", config.redirectUri);

    let url = "https://accounts.spotify.com/authorize";
    url += "?response_type=code"; // Changed from 'token' to 'code'
    url += "&client_id=" + encodeURIComponent(config.clientId);
    url += "&scope=" + encodeURIComponent(scope);
    url += "&redirect_uri=" + encodeURIComponent(config.redirectUri);
    url += "&state=" + encodeURIComponent(state);
    url += "&code_challenge_method=S256";
    url += "&code_challenge=" + encodeURIComponent(codeChallenge);

    return url;
  };

  const handleLoginClick = async () => {
    if (isConfigReady) {
      const spotifyAuthUrl = await generateAuthUrl();
      window.location.href = spotifyAuthUrl;
    } else {
      console.error("Missing required configuration parameters.");
    }
  };

  return (
    <div className="w-screen h-screen bg-background">
      <div className="absolute top-6 right-6 ">
        <ThemeToggler />
      </div>

      <div className="w-full h-2/3 flex flex-col items-center justify-center gap-10 xl:gap-35 2xl:gap-40 text-2xl">
        <Logo className="text-foreground w-3/4 xl:w-2/5 drop-shadow-[0_2px_5px_rgba(0,0,0,0.05)]" />
        <Button
          onClick={handleLoginClick}
          className="h-10 lg:h-16 w-42 lg:w-72 rounded-full bg-primary/10 shadow-md hover:bg-primary/30 text-foreground text-sm lg:text-xl"
          disabled={loading || !isConfigReady}
          aria-disabled={loading || !isConfigReady}
        >
          <SpotifyLogo className="mr-3 w-5 lg:w-8" />
          <div>
            Sign in with&nbsp;
            <span className="underline decoration-spotify">Spotify</span>
          </div>
        </Button>
        {!loading && !isConfigReady && (
          <div className="text-sm text-red-500 mt-2">
            Missing required configuration. Please set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_REDIRECT_URI.
          </div>
        )}
      </div>
      <div className="absolute bottom-3 right-3 text-sm text-foreground underline">
        <a
          href="https://github.com/Zayatsoff"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent"
        >
          made by lior rozin
        </a>
      </div>
    </div>
  );
}
