import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Settings } from "./components/settings";
import { getCurrentWindow } from "@tauri-apps/api/window";

async function init() {
  // Check if this is the settings window
  const currentWindow = getCurrentWindow();
  const label = currentWindow.label;

  if (label === "settings") {
    // Render settings window for the settings webview
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <Settings />
      </React.StrictMode>,
    );
  } else {
    // Render main app for all other windows
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

init();
