# Pip — Tiny Desktop Pet

Pip is a small animated desktop companion built with Electron. It is intended to stay visible on your desktop and provide a lightweight place for quick interactions, reminders, and study support.

## Features

- Frameless desktop pet window with animations
- Click interaction and separate chat window
- Settings window and summon/button helper
- Tray integration and launch helpers for Windows and macOS
- Lovable dashboard source under `dashboard-source/`
- Groq AI integration is a work in progress; contextual replies and dashboard connection still need testing/configuration

## Requirements

- Node.js (LTS recommended)
- npm

## Run the desktop app

```bash
npm install
npm run validate
npm start
```

## Dashboard source

The Lovable-generated dashboard source is in `dashboard-source/`. Follow its README and install its dependencies in that directory before running or deploying it. The Electron app and dashboard currently remain separate components; configure `config/dashboard.json` with your deployed dashboard URL to connect them if needed.

## Configuration and secrets

Do not commit API keys or secrets. Configure any AI provider key in the appropriate server-side environment/secret store, never in frontend code or screenshots. See `docs/ELECTRON_INTEGRATION.md` and `dashboard-source/docs/ELECTRON_INTEGRATION.md`.

## Current status

This is a work in progress. Desktop display and chat-window interactions have been tested locally. Contextual AI responses and full dashboard integration are not yet verified.

## Project structure

- `main.js`, `preload.js`: Electron main process and secure bridge
- `src/`: pet, chat, settings, and summon-button UI
- `assets/`: pet and tray images
- `config/`: pet personality, messages, and dashboard configuration
- `dashboard-source/`: Lovable dashboard application source
- `docs/`: integration notes

## License

Add a license before accepting external contributions or redistributions.
