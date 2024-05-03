import React from "react";
import ReactDOM from "react-dom";
import { SpotifyAuthProvider } from "./context/SpotifyAuthContext";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <SpotifyAuthProvider>
      <App />
    </SpotifyAuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
