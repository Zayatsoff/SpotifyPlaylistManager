import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface SpotifyAuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const SpotifyAuthContext = createContext<SpotifyAuthContextType>({
  token: null,
  setToken: () => {},
});

export const useSpotifyAuth = () => useContext(SpotifyAuthContext);

export const SpotifyAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("spotifyToken");

    if (!token && hash) {
      token = new URLSearchParams(hash.substring(1)).get("access_token");
      window.location.hash = "";
      if (token) {
        window.localStorage.setItem("spotifyToken", token);
      }
    }

    setTokenState(token);

    const storedToken = localStorage.getItem("spotifyToken");
    if (storedToken) {
      setTokenState(storedToken);
    }

    return () => {
      // Cleanup function
    };
  }, []);

  const setToken = (token: string | null) => {
    if (token === null) {
      localStorage.removeItem("spotifyToken"); // Clear token from storage on logout or invalidation
      sessionStorage.clear(); // Clear session storage on logout
    } else {
      localStorage.setItem("spotifyToken", token); // Save token to storage
    }
    setTokenState(token);
  };

  return (
    <SpotifyAuthContext.Provider value={{ token, setToken }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
};
