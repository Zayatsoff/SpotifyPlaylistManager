import { useEffect, useState } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggler from "@/components/ui/ThemeToggler";
import { getConfig } from "@/utils/getConfig";

interface AuthQueryParams {
  code?: string;
  error?: string;
  state?: string;
}

function CallbackPage() {
  const { setToken } = useSpotifyAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate execution using sessionStorage (persists across component remounts)
      const PROCESSING_FLAG = "spotify_callback_processing";
      if (sessionStorage.getItem(PROCESSING_FLAG) === "true") {
        console.log("Callback already processed, skipping...");
        return;
      }
      sessionStorage.setItem(PROCESSING_FLAG, "true");
      // Parse query parameters from URL (not hash, since we're using authorization code flow)
      const queryParams: AuthQueryParams = Object.fromEntries(
        new URLSearchParams(window.location.search)
      );

      if (queryParams.error) {
        console.error("Authorization error:", queryParams.error);
        setError(`Authorization failed: ${queryParams.error}`);
        sessionStorage.removeItem(PROCESSING_FLAG);
        return;
      }

      if (!queryParams.code) {
        console.error("No authorization code received");
        setError("No authorization code received");
        sessionStorage.removeItem(PROCESSING_FLAG);
        return;
      }

      // Validate state parameter
      const stateKey = "spotify_auth_state";
      const expectedState = localStorage.getItem(stateKey);
      if (expectedState && queryParams.state && expectedState !== queryParams.state) {
        console.error("Authorization error: state mismatch");
        setError("State mismatch error");
        sessionStorage.removeItem(PROCESSING_FLAG);
        return;
      }

      // Retrieve code verifier from session storage
      const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
      if (!codeVerifier) {
        console.error("Code verifier not found in session storage");
        setError("Code verifier missing");
        sessionStorage.removeItem(PROCESSING_FLAG);
        return;
      }

      try {
        // Get config to determine API endpoint
        const config = await getConfig();
        
        // Use environment variable to override API endpoint, otherwise use defaults
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
          (import.meta.env.MODE === "development"
            ? "http://127.0.0.1:5001/spotifymanager-liorrozin-co/us-central1/api"
            : "https://us-central1-spotifymanager-liorrozin-co.cloudfunctions.net/api");

        console.log("Using API endpoint:", apiBaseUrl);
        console.log("Exchanging code for token with redirect_uri:", config.redirectUri);

        // Exchange authorization code for access token
        const response = await fetch(`${apiBaseUrl}/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: queryParams.code,
            codeVerifier: codeVerifier,
            redirectUri: config.redirectUri,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Token exchange failed:", errorData);
          setError(`Token exchange failed: ${errorData.error || "Unknown error"}`);
          sessionStorage.removeItem(PROCESSING_FLAG);
          return;
        }

        const tokenData = await response.json();

        // Store tokens
        if (tokenData.access_token) {
          console.log("✅ Token received, saving to localStorage");
          setToken(tokenData.access_token);

          // Store refresh token if available
          if (tokenData.refresh_token) {
            localStorage.setItem("spotifyRefreshToken", tokenData.refresh_token);
          }

          // Store token expiry
          if (tokenData.expires_in) {
            const expiresAt = Date.now() + parseInt(tokenData.expires_in, 10) * 1000;
            localStorage.setItem("spotifyTokenExpiresAt", String(expiresAt));
          }

          // Clean up session storage (but keep the processing flag until navigation completes)
          sessionStorage.removeItem("spotify_code_verifier");
          localStorage.removeItem(stateKey);

          // Clean the URL and navigate
          window.history.pushState({}, document.title, window.location.pathname);
          console.log("✅ Navigating to /playlists");
          navigate("/playlists");
        } else {
          console.error("No access token in response");
          setError("No access token received");
          sessionStorage.removeItem(PROCESSING_FLAG);
        }
      } catch (err) {
        console.error("Error exchanging code for token:", err);
        setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        sessionStorage.removeItem(PROCESSING_FLAG);
      }
    };

    handleCallback();
  }, [setToken, navigate]);

  return (
    <div className="w-screen h-screen bg-background text-foreground">
      <div className="absolute top-6 right-6 ">
        <ThemeToggler />
      </div>
      <div className="w-full h-2/3 flex flex-col items-center justify-center gap-20 xl:gap-35 2xl:gap-40 text-2xl ">
        {error ? (
          <div className="text-red-500">
            {error}
            <div className="text-sm mt-4">
              <a href="/" className="underline">
                Return to login
              </a>
            </div>
          </div>
        ) : (
          "Logged in! Redirecting..."
        )}
      </div>
    </div>
  );
}

export default CallbackPage;
