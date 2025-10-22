import React from "react";
import ReactDOM from "react-dom/client";
import { SpotifyAuthProvider } from "./context/SpotifyAuthContext";
import App from "./App";
import "./index.css";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { DevModeDialogProvider } from "@/components/ui/DevModeDialogProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <DevModeDialogProvider>
        <SpotifyAuthProvider>
          <App />
        </SpotifyAuthProvider>
      </DevModeDialogProvider>
    </ToastProvider>
  </React.StrictMode>
);
