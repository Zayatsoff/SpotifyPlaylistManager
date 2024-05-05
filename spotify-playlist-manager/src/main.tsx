import React from "react";
import ReactDOM from "react-dom/client";
import { SpotifyAuthProvider } from "./context/SpotifyAuthContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SpotifyAuthProvider>
      <App />
    </SpotifyAuthProvider>
  </React.StrictMode>
);
