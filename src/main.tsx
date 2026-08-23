import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import { initLearningEngine } from "./services/learningEngineProvider";
import "./index.css";

import { registerSW } from "virtual:pwa-register";

function bootstrap() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );

  void initLearningEngine().catch((err) => {
    console.error("Failed to initialize learning engine:", err);
  });

  if (import.meta.env.PROD) {
    registerSW({ immediate: true });
  }
}

void bootstrap();
