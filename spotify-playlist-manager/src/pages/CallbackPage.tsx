import { useEffect } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext";
import { useNavigate } from "react-router-dom";

interface AuthQueryParams {
  access_token?: string;
  token_type?: string;
  expires_in?: string;
  error?: string;
  state?: string;
}

function CallbackPage() {
  const { setAuthToken } = useSpotifyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams: AuthQueryParams = Object.fromEntries(
      new URLSearchParams(window.location.hash.substring(1))
    );

    if (queryParams.access_token) {
      // Save the access token
      setAuthToken(queryParams.access_token);

      // Redirect to /playlists
      navigate("/playlists");
    } else if (queryParams.error) {
      // Handle authorization error
      console.error("Authorization error:", queryParams.error);
    }

    // Clean the URL
    window.history.pushState({}, document.title, window.location.pathname);
  }, [setAuthToken, navigate]);

  return <div>Logged in! Redirecting...</div>;
}

export default CallbackPage;
