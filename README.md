# NeuroPathshala PALASH MTB-MLE

NeuroPathshala is an offline-first teaching assistant for Hindi-medium primary teachers delivering foundational literacy and numeracy through Santhali, Ho, and Mundari language bridges.

## Current capabilities

- Hindi-to-Santhali local dictionary translation with verified classroom phrases.
- Connected translation paths may be available for Ho and Mundari when the service is online; no verified local Ho or Mundari resources are bundled.
- Hindi speech input and classroom dialogue logging with measured translation latency.
- AI-generated lesson plans and bilingual worksheets aligned to a stated NIPUN Bharat FLN outcome.
- Visual flashcards, printable worksheets, local Jharkhand contexts, and localStorage persistence.
- PWA app-shell caching for use after first online load; records can be exported as JSON.

## Run locally

Prerequisites: Node.js 18+.

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`. Start the optional Express service in a second terminal for connected AI features:

```bash
npm run server
```

The server listens on port 3001. `GEMINI_API_KEY` and `SARVAM_API_KEY` in `.env` enable connected lesson, worksheet, translation, and Hindi TTS features; the server still starts without them so local/offline Santhali resources remain usable. Tribal-language audio is not returned unless a verified native recording is configured.

## Offline tablet setup

1. Serve the production build over HTTPS. Service workers do not install from an insecure remote origin; `localhost` is allowed for development.
2. Open the app once while connected, then use the browser menu to install it as an app.
3. Open Settings, enable Offline-First Mode, run a sync while connected, and export a JSON backup before deployment.
4. In the field, use local Santhali phrases, lesson/worksheet libraries, flashcards, and classroom logs without connectivity. Connected AI calls fall back locally or wait for later retry.
5. Test the installed PWA on the target Android 9+ tablet with 2 GB RAM: cold launch offline, translation, worksheet viewing, speech input, localStorage persistence, and backup export/import.

## Demo flow

1. Select a Santhali phrase and show the measured response time.
2. Start Live Classroom, speak a Hindi instruction, show the translated dialogue, and record a student response.
3. Generate a lesson and worksheet for a Jharkhand context; show the NIPUN outcome and bilingual print preview.
4. Switch to Ho or Mundari to demonstrate the honest unavailable-local-resource state and connected-service notice.
5. Disable the network, reload the installed app, and demonstrate local content and session logging.

## Integrity notes

Tribal-language audio is not simulated with Hindi, English, or generic browser voices. Native audio is played only when a verified recording asset is connected. AI-generated Ho, Mundari, and Santhali text must be reviewed by a native speaker before classroom use. The application does not claim production latency, linguistic accuracy, or hardware certification until measured in deployment tests.
