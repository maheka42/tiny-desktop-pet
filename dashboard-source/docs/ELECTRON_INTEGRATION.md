# Tiny Desktop Pet — Electron integration

The web dashboard (this project) and the Electron desktop pet are separate apps.

| Lives in the dashboard (web) | Lives in Electron only |
| --- | --- |
| Tasks, XP, streaks, mood, evolution UI | Transparent frameless always-on-top pet window |
| AI chat UI (Groq via server function) | Draggable summon button, system tray |
| Settings + personality editor | Pet animations, reminder scheduling + notifications |
| Pomodoro UI | Quiet-hours enforcement, recovery launcher |

Nothing Electron-specific runs in the browser preview. The dashboard header shows "Desktop app not connected" until the bridge below exists.

## Project structure

```text
src/lib/pet/
  personality.ts      editable personality + offline fallback replies
  progression.ts      pure XP / stage / streak / mood / quiet-hours rules (tested)
  store.ts            persisted state (localStorage) + actions
  bridge.ts           typed dashboard <-> desktop message contract
  chat.functions.ts   server function calling Groq (GROQ_API_KEY secret)
src/components/pet/   PetAvatar, PetCard, TaskList, Pomodoro, ChatPanel, AppShell
src/routes/           /, /tasks, /chat, /settings
```

## Bridge contract (`window.tinyPet`, version 1)

Dashboard -> desktop (`send`): `state:sync`, `settings:update`, `task:completed`, `pet:say`, `pomodoro:start`, `pomodoro:stop`.
Desktop -> dashboard (`onMessage`): `pomodoro:finished`, `reminder:acknowledged`, `pet:clicked`.
Exact payload types: `src/lib/pet/bridge.ts`.

## Steps for the existing Electron project

1. **Load the dashboard** in a normal `BrowserWindow` (opened from the tray "Open dashboard" item), pointing at the published dashboard URL. Keep the pet window as-is.
2. **Preload** (`dashboard-preload.js`, `contextIsolation: true`, `nodeIntegration: false`):
   ```js
   const { contextBridge, ipcRenderer } = require("electron");
   contextBridge.exposeInMainWorld("tinyPet", {
     version: 1,
     send: (msg) => ipcRenderer.send("tinypet:from-dashboard", msg),
     onMessage: (cb) => {
       const h = (_e, msg) => cb(msg);
       ipcRenderer.on("tinypet:to-dashboard", h);
       return () => ipcRenderer.removeListener("tinypet:to-dashboard", h);
     },
   });
   ```
3. **Main process**: handle `tinypet:from-dashboard`:
   - `settings:update` -> reschedule water / check-in timers in main, respect `quietStart`/`quietEnd`. Keep these timers in main, separate from animation timers and from AI requests.
   - `task:completed` -> play celebrate animation in the pet window.
   - `pet:say` -> show the speech bubble in the pet window.
   - `pomodoro:start|stop` -> show/hide focus mode on the pet.
   - `state:sync` -> cache XP/stage so the pet window renders the right evolution sprite even if the dashboard is closed.
   Send `tinypet:to-dashboard` messages via `dashboardWindow.webContents.send(...)`.
4. **AI from the pet window**: call the dashboard's server function over HTTPS rather than embedding the Groq key in Electron. The key never ships in the desktop binary.
5. Reuse `progression.ts` rules in Electron if the pet needs to compute stage/mood offline (it is dependency-free).

## Not verified here
The Electron side has not been built or run from this project; the steps above are the contract it must implement.
