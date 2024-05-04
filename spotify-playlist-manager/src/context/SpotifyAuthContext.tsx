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
    // Attempt to retrieve the token from local storage
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
