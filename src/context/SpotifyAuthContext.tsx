import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useToast } from "@/components/ui/toast/ToastProvider";

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
  const { showToast } = useToast();

  const notifyDevMode403 = () => {
    const key = "notifiedSpotifyDevMode403";
    if (sessionStorage.getItem(key)) return;
    showToast({
      title: "Access required",
      description:
        "Spotify returned 403. This app is in developer mode. Email contact@liorrozin.co to get access.",
      variant: "error",
      actionLabel: "Contact",
      onAction: () => {
        window.location.href =
          "mailto:contact@liorrozin.co?subject=Spotify%20Playlist%20Manager%20access%20request";
      },
      duration: 8000,
    });
    sessionStorage.setItem(key, "1");
  };

  useEffect(() => {
    const fetchUserId = async (token: string) => {
      try {
        const response = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 403) {
          notifyDevMode403();
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

    const hash = window.location.hash;
    let token = window.localStorage.getItem("spotifyToken");

    if (!token && hash) {
      token = new URLSearchParams(hash.substring(1)).get("access_token");
      window.location.hash = "";
      if (token) {
        window.localStorage.setItem("spotifyToken", token);
        fetchUserId(token);
      }
    }

    // Clear expired token if present
    const expiresAtRaw = localStorage.getItem("spotifyTokenExpiresAt");
    const isExpired = expiresAtRaw ? Date.now() > parseInt(expiresAtRaw, 10) : false;
    if (isExpired) {
      localStorage.removeItem("spotifyToken");
      localStorage.removeItem("spotifyTokenExpiresAt");
      token = null;
    }

    setTokenState(token);

    const storedToken = localStorage.getItem("spotifyToken");
    if (storedToken) {
      setTokenState(storedToken);
      fetchUserId(storedToken);
    }

    return () => {
      // Cleanup function
    };
  }, []);

  const setToken = (token: string | null) => {
    if (token === null) {
      localStorage.removeItem("spotifyToken"); // Clear token from storage on logout or invalidation
      localStorage.removeItem("spotifyTokenExpiresAt");
      sessionStorage.clear(); // Clear session storage on logout
      setUserId(null); // Clear userId on logout
    } else {
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
