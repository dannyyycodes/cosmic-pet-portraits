import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import { initBotId } from "botid/client/core";
import App from "./App.tsx";
import "./index.css";

// Vercel BotID — invisible bot detection. No CAPTCHA, no challenge UI, no
// IP-reputation heuristics (so VPN / iCloud Private Relay / Brave / mobile
// CGNAT users are NOT punished). The client-side challenge runs silently
// from boot; protected POST routes carry the challenge solution as headers
// which the server validates via checkBotId(). See api/portraits.ts.
initBotId({
  protect: [
    // /api/portraits is the router for studio actions. We currently gate
    // instant-signup (free-trial creation) on the server. Protecting all
    // POSTs to the router is fine — it costs nothing extra and lets us
    // extend coverage to other expensive actions later (generate, etc.).
    { path: "/api/portraits", method: "POST" },
  ],
});

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "https://9fa652e4baf632dbe99c97a39f7e508c@o4511063623663616.ingest.de.sentry.io/4511063629693008";
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
