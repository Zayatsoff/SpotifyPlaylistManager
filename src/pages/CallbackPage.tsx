import { useEffect } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggler from "@/components/ui/ThemeToggler";

interface AuthQueryParams {
  access_token?: string;
  token_type?: string;
  expires_in?: string;
  error?: string;
  state?: string;
}

function CallbackPage() {
  const { setToken } = useSpotifyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams: AuthQueryParams = Object.fromEntries(
      new URLSearchParams(window.location.hash.substring(1))
    );

    if (queryParams.access_token) {
      // Validate state parameter
      const stateKey = "spotify_auth_state";
      const expectedState = localStorage.getItem(stateKey);
      if (expectedState && queryParams.state && expectedState !== queryParams.state) {
        console.error("Authorization error: state mismatch");
        return;
      }

      // Persist token expiry for later checks
      if (queryParams.expires_in) {
        const expiresAt = Date.now() + parseInt(queryParams.expires_in, 10) * 1000;
        localStorage.setItem("spotifyTokenExpiresAt", String(expiresAt));
      }

      // Save the access token
      setToken(queryParams.access_token);

      // Redirect to /playlists
      navigate("/playlists");
    } else if (queryParams.error) {
      // Handle authorization error
      console.error("Authorization error:", queryParams.error);
    }

    // Clean the URL
    window.history.pushState({}, document.title, window.location.pathname);
  }, [setToken, navigate]);

  return (
    <div className="w-screen h-screen bg-background text-foreground">
      <div className="absolute top-6 right-6 ">
        <ThemeToggler />
      </div>
      <div className="w-full h-2/3 flex flex-col items-center justify-center gap-20 xl:gap-35 2xl:gap-40 text-2xl ">
        Logged in! Redirecting...
      </div>
    </div>
  );
}

export default CallbackPage;
