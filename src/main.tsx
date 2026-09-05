import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import type { LearningService } from "./application/LearningService";
import { LocalLearningService } from "./application/LocalLearningService";
import { LearningServiceProvider } from "./ui/providers/LearningServiceProvider";
import "./index.css";

import { registerSW } from "virtual:pwa-register";

function Root() {
  const [service, setService] = useState<LearningService | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const localService = new LocalLearningService();
    void localService
      .initialize()
      .then(() => setService(localService))
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : "Не вдалося ініціалізувати додаток");
      });
  }, []);

  if (initError) {
    return (
      <div className="app-shell" style={{ padding: 24 }}>
        <h1>Помилка запуску</h1>
        <p>{initError}</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="app-shell" style={{ padding: 24 }}>
        <p>Завантаження…</p>
      </div>
    );
  }

  return (
    <LearningServiceProvider service={service}>
      <HashRouter>
        <App />
      </HashRouter>
    </LearningServiceProvider>
  );
}

function bootstrap() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );

  if (import.meta.env.PROD) {
    registerSW({ immediate: true });
  }
}

void bootstrap();
