import React, { createContext, useContext, useState, ReactNode } from "react";

interface SpotifyAuthContextType {
  token: string | null;
  setAuthToken: (token: string) => void;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextType | null>(null);

export function useSpotifyAuth() {
  const context = useContext(SpotifyAuthContext);
  if (!context) {
    throw new Error("useSpotifyAuth must be used within a SpotifyAuthProvider");
  }
  return context;
}

export const SpotifyAuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  const setAuthToken = (newToken: string) => {
    setToken(newToken);
  };

  return (
    <SpotifyAuthContext.Provider value={{ token, setAuthToken }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
};
