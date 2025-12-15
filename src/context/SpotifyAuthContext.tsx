import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useDevModeDialog } from "@/components/ui/DevModeDialogProvider";

export interface SpotifyAuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  userId: string | null;
}

export const SpotifyAuthContext = createContext<SpotifyAuthContextType>({
  token: null,
  setToken: () => {},
  userId: null,
});

export const useSpotifyAuth = () => useContext(SpotifyAuthContext);

export const SpotifyAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { showDevMode403 } = useDevModeDialog();

  const notifyDevMode403 = () => {
    // Always surface the modal so cached sessions still see the warning
    showDevMode403();
  };

  useEffect(() => {
    const fetchUserIdOnLoad = async (token: string) => {
      try {
        console.log("🔍 Validating token on load...");
        const response = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 403) {
          console.log("⚠️ 403 Forbidden - showing dev mode");
          notifyDevMode403();
          return;
        }
        if (response.status === 401) {
          console.error("❌ Token is invalid (401) on load, clearing auth state");
          // Clear invalid token
          localStorage.removeItem("spotifyToken");
          localStorage.removeItem("spotifyTokenExpiresAt");
          localStorage.removeItem("spotifyRefreshToken");
          setTokenState(null);
          return;
        }
        if (!response.ok) {
          console.error("Failed to fetch user ID", { status: response.status });
          return;
        }
        const data = await response.json();
        console.log("✅ Token validated, user ID:", data.id);
        setUserId(data.id);
      } catch (error) {
        console.error("Failed to fetch user ID", error);
      }
    };

    // Check for stored token
    let token = window.localStorage.getItem("spotifyToken");
    console.log("🔑 SpotifyAuthContext initializing, token found:", token ? `${token.substring(0, 20)}...` : "null");

    // Clear expired token if present
    const expiresAtRaw = localStorage.getItem("spotifyTokenExpiresAt");
    const isExpired = expiresAtRaw ? Date.now() > parseInt(expiresAtRaw, 10) : false;
    if (isExpired) {
      console.log("⏰ Token expired, clearing");
      localStorage.removeItem("spotifyToken");
      localStorage.removeItem("spotifyTokenExpiresAt");
      localStorage.removeItem("spotifyRefreshToken");
      token = null;
    }

    setTokenState(token);

    if (token) {
      fetchUserIdOnLoad(token);
    } else {
      console.log("ℹ️ No valid token on load, user needs to login");
    }

    return () => {
      // Cleanup function
    };
  }, []);

  const setToken = (token: string | null) => {
    if (token === null) {
      console.log("🗑️ Clearing token and auth state");
      localStorage.removeItem("spotifyToken"); // Clear token from storage on logout or invalidation
      localStorage.removeItem("spotifyTokenExpiresAt");
      localStorage.removeItem("spotifyRefreshToken");
      // Clear specific session storage items instead of everything
      sessionStorage.removeItem("spotify_code_verifier");
      sessionStorage.removeItem("spotify_callback_processing");
      sessionStorage.removeItem("cachedPlaylists");
      sessionStorage.removeItem("devSampleApplied");
      setUserId(null); // Clear userId on logout
    } else {
      console.log("💾 Saving new token:", token.substring(0, 20) + "...");
      localStorage.setItem("spotifyToken", token); // Save token to storage
      fetchUserId(token); // Fetch user ID for the new token
    }
    setTokenState(token);
  };

  const fetchUserId = async (token: string) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 403) {
        notifyDevMode403();
        return;
      }
      if (response.status === 401) {
        console.error("Token is invalid (401), clearing auth state");
        // Clear invalid token
        setToken(null);
        return;
      }
      if (!response.ok) {
        console.error("Failed to fetch user ID", { status: response.status });
        return;
      }
      const data = await response.json();
      setUserId(data.id);
    } catch (error) {
      console.error("Failed to fetch user ID", error);
    }
  };

  return (
    <SpotifyAuthContext.Provider value={{ token, setToken, userId }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
};
