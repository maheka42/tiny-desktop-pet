# Connecting the Lovable dashboard to the Electron pet

The Electron app remains the actual desktop companion. The dashboard runs as a separate web app and connects through a restricted Electron preload bridge.

## 1. Publish the Lovable dashboard

Deploy the Lovable/TanStack Start project using the hosting setup it supports. Confirm the dashboard URL and that chat works in the browser. The Groq key must remain a server-side secret named `GROQ_API_KEY`; never put it in browser code or the Electron project.

## 2. Configure the desktop app

Edit `config/dashboard.json` and set `url` to the deployed dashboard's origin, for example:

```json
{
  "url": "https://your-published-dashboard.example"
}
```

Use the real URL assigned to your project. Do not include `/chat`; Electron adds the route itself. For local development, `http://localhost:3000` and `http://127.0.0.1:3000` are allowed.

## 3. Run the desktop app

From this folder:

```powershell
npm install
npm start
```

Use the system tray's **Open Dashboard** item to open the dashboard, or **Chat** to open its `/chat` route. If no dashboard URL is configured, Chat falls back to the built-in offline chat window.

## Bridge messages implemented

- `state:sync`: dashboard XP/streak are reflected in the pet's local state.
- `settings:update`: dashboard reminder intervals and quiet hours update Electron's reminder timers.
- `task:completed`: pet celebrates completed dashboard tasks.
- `pet:say`: displays a short message in the pet's speech bubble.
- `pomodoro:start` / `pomodoro:stop`: starts/stops an Electron-side focus timer. When it finishes, Electron sends `pomodoro:finished` to the dashboard.

The bridge is exposed only to the configured dashboard window. Main-process handlers check the sender origin, and Electron does not receive the Groq API key.

## Important boundaries

- Dashboard tasks and Electron's legacy local task list are currently separate stores. The dashboard is the recommended place to manage tasks and XP.
- The Electron settings page still contains its legacy optional OpenAI-key setting; it is not needed for Groq. Groq chat is provided by the deployed dashboard's server-side function.
- The web dashboard and its Groq server function must be reachable for AI chat. The pet animations, tray, summon button, and local reminders continue to run if the dashboard or Groq is unavailable.
- This integration has been statically inspected and syntax-checked. It must still be launched and manually tested on your Windows machine with your actual deployed dashboard URL.
