import * as Sentry from "@sentry/nuxt"
Sentry.init({
  dsn: "https://b4ec4a38624a61021e07bf6921227294@o4511466623205376.ingest.de.sentry.io/4511466649419856",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})
