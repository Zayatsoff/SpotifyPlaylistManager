import { useEffect } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext"; // Update import
import { useNavigate } from "react-router-dom";

interface AuthQueryParams {
  access_token?: string;
  token_type?: string;
  expires_in?: string;
  error?: string;
  state?: string;
}

function CallbackPage() {
  const { setToken } = useSpotifyAuth(); // Update to use setToken
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams: AuthQueryParams = Object.fromEntries(
      new URLSearchParams(window.location.hash.substring(1))
    );

    if (queryParams.access_token) {
      // Save the access token
      setToken(queryParams.access_token); // Update to use setToken

      // Redirect to /playlists
      navigate("/playlists");
    } else if (queryParams.error) {
      // Handle authorization error
      console.error("Authorization error:", queryParams.error);
    }

    // Clean the URL
    window.history.pushState({}, document.title, window.location.pathname);
  }, [setToken, navigate]); // Update dependencies array

  return <div>Logged in! Redirecting...</div>;
}

export default CallbackPage;
