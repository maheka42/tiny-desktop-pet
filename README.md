# Tiny Desktop Pet — Electron + Groq AI dashboard

A Windows/macOS desktop companion with a transparent, frameless, always-on-top animated pet, plus a Lovable-built productivity dashboard with Groq-powered AI chat.

## What is included

### Electron desktop app
- Transparent, frameless, always-on-top pet window.
- Animated idle, blinking, walking, entering/leaving, wandering and celebration effects.
- Draggable summon button and system tray.
- Local water/check-in/visit timers, quiet hours, pause/resume and recovery launcher.
- Pet speech bubble and offline chat fallback.
- Local settings, XP, streak and legacy task persistence.

### Lovable dashboard (`dashboard-source/`)
- Home, tasks, chat and settings routes.
- Groq AI chat through a server-side function; `GROQ_API_KEY` remains server-side.
- Offline fallback, XP, streaks, focus timer, pet personality and progression.
- Electron integration guide and typed bridge contract.

## Quick start: Windows desktop pet

1. Install Node.js LTS from https://nodejs.org/.
2. Open this project folder in VS Code.
3. In Terminal, run:

   ```powershell
   npm install
   npm start
   ```

   Or double-click `launch-windows.bat`.

4. If the pet disappears, double-click `bring-on-screen-windows.bat`.

The Electron desktop pet and its local reminders work even if the dashboard is not configured.

## Connect the dashboard

1. Deploy the `dashboard-source/` Lovable/TanStack Start project using its supported hosting setup.
2. Add `GROQ_API_KEY` as a server-side secret in the dashboard hosting environment. Do not put it in frontend code or this Electron repository.
3. Verify the deployed dashboard's `/chat` route and Groq replies in a browser.
4. Edit `config/dashboard.json` and set `url` to your deployed dashboard origin:

   ```json
   {
     "url": "https://your-real-dashboard-url.example"
   }
   ```

   Replace the example with the actual deployed URL.

5. Restart Electron. Open the system tray menu and select **Open Dashboard** or **Chat**.

If the URL is empty, the tray's Chat option opens the built-in offline chat window. See `docs/ELECTRON_INTEGRATION.md` for the bridge details.

## Architecture

- **Electron** owns desktop-only capabilities: transparent pet window, animations, tray, summon button, timers, quiet hours and recovery.
- **Dashboard** owns the polished task/chat/settings UI, XP/streak logic and Groq AI chat.
- **Groq API key** exists only in the dashboard server environment. Electron does not store or receive it.
- **Dashboard bridge** is exposed through `dashboard-preload.js` with context isolation and main-process sender-origin checks.

## Important limitations

- The Electron bridge is implemented but must be tested against your actual deployed dashboard URL on Windows.
- Dashboard tasks and the Electron legacy local task list are separate stores; manage tasks in the dashboard for consistent XP.
- The Electron settings page still has a legacy OpenAI API-key field. It is not required for Groq and should be ignored; Groq is used by the dashboard chat.
- If the deployed dashboard/server is unavailable, Electron's animations and local reminders continue, but dashboard-based AI chat will not be available.
- The browser preview alone cannot provide a transparent always-on-top desktop pet.

## Validate Electron JavaScript

```powershell
npm run validate
```

## Project layout

```text
tiny-desktop-pet/
├── assets/
├── config/
│   ├── dashboard.json
│   ├── messages.json
│   └── personality.json
├── docs/
│   └── ELECTRON_INTEGRATION.md
├── src/                  # Electron pet, chat and settings windows
├── dashboard-preload.js  # restricted dashboard-to-Electron bridge
├── dashboard-source/     # Lovable dashboard source
├── main.js
├── preload.js
├── package.json
└── README.md
```
