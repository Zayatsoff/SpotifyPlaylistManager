import React from "react";
import ReactDOM from "react-dom/client";
import { SpotifyAuthProvider } from "./context/SpotifyAuthContext";
import App from "./App";
import "./index.css";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <SpotifyAuthProvider>
        <App />
      </SpotifyAuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
