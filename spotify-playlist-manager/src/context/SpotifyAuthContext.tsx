import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface SpotifyAuthContextType {
  token: string | null;
  setToken: (token: string) => void;
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
    const storedToken = localStorage.getItem("spotifyToken");
    if (storedToken) {
      setTokenState(storedToken);
    }
  }, []);

  const setToken = (token: string) => {
    localStorage.setItem("spotifyToken", token);
    setTokenState(token);
  };

  return (
    <SpotifyAuthContext.Provider value={{ token, setToken }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
};
