const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, safeStorage, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const USER_DIR = app.getPath('userData');
const DATA_FILE = path.join(USER_DIR, 'settings.json');
const PERSONALITY_FILE = path.join(ROOT, 'config', 'personality.json');
const MESSAGES_FILE = path.join(ROOT, 'config', 'messages.json');
const DASHBOARD_CONFIG_FILE = path.join(ROOT, 'config', 'dashboard.json');
let dashboardConfig = { url: '' };
try {
  if (fs.existsSync(DASHBOARD_CONFIG_FILE)) {
    dashboardConfig = { ...dashboardConfig, ...JSON.parse(fs.readFileSync(DASHBOARD_CONFIG_FILE, 'utf8')) };
  }
} catch (e) { console.error('Could not load dashboard config:', e); }

function configuredDashboardUrl(route = '/') {
  const raw = String(dashboardConfig.url || '').trim();
  if (!raw) return null;
  try {
    const base = new URL(raw);
    if (!['https:', 'http:'].includes(base.protocol)) return null;
    if (base.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(base.hostname)) return null;
    base.pathname = route.startsWith('/') ? route : `/${route}`;
    base.search = '';
    base.hash = '';
    return base.toString();
  } catch { return null; }
}

function isTrustedDashboardSender(event) {
  const expected = configuredDashboardUrl('/');
  if (!expected) return false;
  try {
    const actual = new URL(event.senderFrame.url);
    const allowed = new URL(expected);
    return actual.origin === allowed.origin;
  } catch { return false; }
}

let petWindow = null;
let summonWindow = null;
let chatWindow = null;
let settingsWindow = null;
let dashboardWindow = null;
let pomodoroTimer = null;
let tray = null;
let timers = [];
let visitActive = false;
let lastActivityAt = Date.now();
let lastCheckinAt = Date.now();
let lastBreakNudgeAt = 0;
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); } else {
  app.on('second-instance', (_event, commandLine) => {
    if (commandLine.includes('--bring-on-screen')) resetPositions();
    else showPet({type:'summon', category:'greeting'});
  });
}

const defaults = {
  enabled: true,
  visitFrequency: 5,
  waterFrequency: 45,
  checkins: true,
  checkInInterval: 25,
  sound: false,
  animationSpeed: 1,
  petSize: 1,
  aiChat: false,
  apiKeyEncrypted: '',
  launchOnStartup: false,
  alwaysOnTop: true,
  quietStart: '22:30',
  quietEnd: '07:30',
  pausedUntil: 0,
  buttonPosition: null,
  petPosition: null,
  xp: 0,
  streak: 0,
  lastCheckinDate: '',
  tasks: []
};

let state = loadState();
const personality = JSON.parse(fs.readFileSync(PERSONALITY_FILE, 'utf8'));
const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));

function loadState() {
  try {
    fs.mkdirSync(USER_DIR, { recursive: true });
    if (fs.existsSync(DATA_FILE)) {
      return { ...defaults, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
    }
  } catch (e) { console.error('Could not load settings:', e); }
  return { ...defaults };
}

function persist() {
  try {
    fs.mkdirSync(USER_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (e) { console.error('Could not save settings:', e); }
}

function isQuiet() {
  if (state.pausedUntil && Date.now() < state.pausedUntil) return true;
  const [sh, sm] = state.quietStart.split(':').map(Number);
  const [eh, em] = state.quietEnd.split(':').map(Number);
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm, end = eh * 60 + em;
  return start > end ? (mins >= start || mins < end) : (mins >= start && mins < end);
}

function clampPosition(x, y, w, h) {
  const display = screen.getDisplayNearestPoint({ x, y }) || screen.getPrimaryDisplay();
  const wa = display.workArea;
  return {
    x: Math.max(wa.x, Math.min(x, wa.x + wa.width - w)),
    y: Math.max(wa.y, Math.min(y, wa.y + wa.height - h))
  };
}

function petBounds() {
  const size = Math.round(320 * Number(state.petSize || 1));
  return { width: Math.round(size * 1.55), height: size };
}

function positionPet() {
  if (!petWindow) return;
  const { width, height } = petBounds();
  petWindow.setSize(width, height, false);
  let x, y;
  if (state.petPosition) ({ x, y } = state.petPosition);
  else {
    const wa = screen.getPrimaryDisplay().workArea;
    x = wa.x + wa.width - width - 24;
    y = wa.y + wa.height - height - 8;
  }
  const p = clampPosition(x, y, width, height);
  petWindow.setPosition(p.x, p.y, false);
}

function positionSummon() {
  if (!summonWindow) return;
  const { width, height } = { width: 54, height: 54 };
  let x, y;
  if (state.buttonPosition) ({ x, y } = state.buttonPosition);
  else {
    const wa = screen.getPrimaryDisplay().workArea;
    x = wa.x + wa.width - width - 8;
    y = wa.y + Math.round(wa.height * 0.45);
  }
  const p = clampPosition(x, y, width, height);
  summonWindow.setPosition(p.x, p.y, false);
}

function createPetWindow() {
  petWindow = new BrowserWindow({
    ...petBounds(),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: state.alwaysOnTop,
    show: false,
    webPreferences: { preload: path.join(ROOT, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  petWindow.setAlwaysOnTop(state.alwaysOnTop, 'floating');
  petWindow.loadFile(path.join(ROOT, 'src', 'pet.html'));
  petWindow.on('moved', () => { state.petPosition = petWindow.getPosition().reduce((a,v,i) => (a[i ? 'y' : 'x']=v,a), {}); persist(); });
}

function createSummonWindow() {
  summonWindow = new BrowserWindow({
    width: 54, height: 54, frame: false, transparent: true, backgroundColor: '#00000000',
    resizable: false, movable: true, hasShadow: false, skipTaskbar: true, alwaysOnTop: true,
    webPreferences: { preload: path.join(ROOT, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  summonWindow.loadFile(path.join(ROOT, 'src', 'button.html'));
  summonWindow.on('moved', () => { const [x,y]=summonWindow.getPosition(); state.buttonPosition={x,y}; persist(); });
}

function showPet(event = { type: 'visit', category: randomCategory() }) {
  if (!petWindow) return;
  positionPet();
  petWindow.showInactive();
  petWindow.webContents.send('pet-event', { type: 'enter', event });
  visitActive = true;
  setTimeout(() => { if (petWindow && !petWindow.isDestroyed()) petWindow.webContents.send('pet-event', { type:'show-message', event }); }, 750);
  const stay = event.type === 'summon' ? 12000 : 16000 + Math.floor(Math.random()*10000);
  setTimeout(() => leavePet(), stay);
}

function leavePet() {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.webContents.send('pet-event', { type:'leave' });
  setTimeout(() => { if (petWindow && !petWindow.isDestroyed()) petWindow.hide(); visitActive = false; }, 1000);
}

function randomCategory() {
  const r = Math.random();
  if (r < .24) return 'greeting';
  if (r < .43) return 'water';
  if (r < .60) return 'stretch';
  if (r < .79) return 'mood';
  return 'break';
}

function pick(category) {
  const arr = messages[category] || messages.greeting;
  return arr[Math.floor(Math.random() * arr.length)];
}

function sendState() {
  for (const w of [petWindow, chatWindow, settingsWindow, summonWindow, dashboardWindow]) {
    if (w && !w.isDestroyed()) w.webContents.send('state-updated', publicState());
  }
}

function publicState() {
  return { ...state, apiKeyEncrypted: state.apiKeyEncrypted ? '••••••••' : '', petMood: mood(), evolution: evolution() };
}

function mood() {
  if (state.streak >= 7) return 'happy';
  if (Date.now() - lastCheckinAt > 75*60*1000) return 'sleepy';
  if (Date.now() - lastCheckinAt > 45*60*1000) return 'sad';
  return 'happy';
}
function evolution() {
  if (state.xp >= 500) return 'Evolved';
  if (state.xp >= 150) return 'Grown';
  return 'Baby';
}

function checkin() {
  const today = new Date().toISOString().slice(0,10);
  if (state.lastCheckinDate !== today) {
    state.streak += 1;
    state.lastCheckinDate = today;
  }
  state.xp += 10;
  lastCheckinAt = Date.now();
  lastActivityAt = Date.now();
  persist(); sendState();
  if (petWindow) petWindow.webContents.send('pet-event', { type:'celebrate', text:'Nice check-in. Keep going.' });
}

function setupTimers() {
  for (const t of timers) clearInterval(t);
  timers = [];
  timers.push(setInterval(() => {
    if (!state.enabled || isQuiet() || visitActive) return;
    showPet({ type:'visit', category: randomCategory() });
  }, Math.max(1, Number(state.visitFrequency)) * 60000));
  timers.push(setInterval(() => {
    if (!state.enabled || isQuiet() || visitActive) return;
    showPet({ type:'visit', category:'water' });
  }, Math.max(5, Number(state.waterFrequency)) * 60000));
  timers.push(setInterval(() => {
    if (!state.enabled || !state.checkins || isQuiet() || visitActive) return;
    showPet({ type:'checkin', category:'mood', checkin:true });
  }, Math.max(5, Number(state.checkInInterval)) * 60000));
  timers.push(setInterval(() => {
    const longSession = Date.now() - lastActivityAt >= 120*60000;
    if (!state.enabled || isQuiet() || !longSession || Date.now()-lastBreakNudgeAt < 120*60000) return;
    lastBreakNudgeAt = Date.now();
    showPet({ type:'break', category:'longSession', text:pick('longSession') });
  }, 60000));
}

async function callAI(message, history) {
  if (!state.apiKeyEncrypted || !safeStorage.isEncryptionAvailable()) throw new Error('API key is not available securely.');
  const key = safeStorage.decryptString(Buffer.from(state.apiKeyEncrypted, 'base64'));
  const system = `${personality.personality}\nPet name: ${personality.name}. Keep reminders relevant and never claim to have real-world awareness.`;
  const input = [{ role:'system', content:system }, ...(history || []).slice(-12), { role:'user', content:message }];
  const res = await fetch('https://api.openai.com/v1/responses', {
    method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
    body: JSON.stringify({ model: personality.aiModel, input, max_output_tokens:120 })
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status}).`);
  const data = await res.json();
  return data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join(' ').trim() || 'I am here with you.';
}

function basicReply(message) {
  const m = message.toLowerCase();
  if (/\b(hi|hello|hey)\b/.test(m)) return 'Hi! I am right here with you.';
  if (m.includes('nice to meet')) return 'Nice to meet you too. I will keep you company.';
  if (m.includes('how are you')) return 'I am happy to be on your desktop. How are you doing?';
  if (m.includes('tired')) return 'You sound tired. Take a small break, stretch, and get some water.';
  if (m.includes('water')) return 'Good call. Go grab a few sips.';
  if (m.includes('stressed') || m.includes('stress')) return 'Pause for a minute. Breathe slowly, then pick one small thing to do next.';
  if (m.includes('break')) return 'Yes. Step away for a few minutes and let your eyes rest.';
  if (m.includes('stuck')) return 'Try the smallest next step. You do not have to solve everything at once.';
  if (m.includes('sad')) return 'I am staying here with you. Be gentle with yourself for a moment.';
  return 'I am listening. Tell me what is going on.';
}

function createTray() {
  const iconPath = path.join(ROOT, 'assets', 'tray.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('Tiny Desktop Pet');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label:'Summon Pet', click:() => showPet({type:'summon', category:'greeting'}) },
    { label:'Open Dashboard', click:() => openDashboard('/') },
    { label:'Chat', click:() => openChat() },
    { label:'Settings', click:() => openSettings() },
    { type:'separator' },
    { label: state.pausedUntil > Date.now() ? 'Resume Pet' : 'Pause Pet', click:() => state.pausedUntil > Date.now() ? resume() : pause(60) },
    { type:'separator' },
    { label:'Quit', click:() => app.quit() }
  ]));
}

function openDashboard(route = '/') {
  const target = configuredDashboardUrl(route);
  if (!target) {
    openChatFallback();
    return;
  }
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.show();
    dashboardWindow.focus();
    dashboardWindow.loadURL(target);
    return;
  }
  dashboardWindow = new BrowserWindow({
    width: 1180, height: 820, minWidth: 820, minHeight: 620,
    frame: true, show: false, title: 'Tiny Desktop Pet',
    webPreferences: {
      preload: path.join(ROOT, 'dashboard-preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  dashboardWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const targetUrl = new URL(url);
      if (targetUrl.protocol === 'https:') shell.openExternal(url);
    } catch {}
    return { action: 'deny' };
  });
  dashboardWindow.webContents.on('will-navigate', (event, url) => {
    const targetUrl = configuredDashboardUrl('/');
    try {
      if (!targetUrl || new URL(url).origin !== new URL(targetUrl).origin) event.preventDefault();
    } catch { event.preventDefault(); }
  });
  dashboardWindow.once('ready-to-show', () => dashboardWindow && dashboardWindow.show());
  dashboardWindow.on('closed', () => { dashboardWindow = null; });
  dashboardWindow.loadURL(target);
}

function openChat() {
  if (configuredDashboardUrl('/chat')) {
    openDashboard('/chat');
    return;
  }
  openChatFallback();
}

function openChatFallback() {
  if (chatWindow && !chatWindow.isDestroyed()) { chatWindow.show(); chatWindow.focus(); return; }
  chatWindow = new BrowserWindow({ width:380, height:570, frame:false, resizable:false, backgroundColor:'#fff9f2', title:'Tiny Pet Chat', alwaysOnTop:true,
    webPreferences:{ preload:path.join(ROOT,'preload.js'), contextIsolation:true, nodeIntegration:false } });
  chatWindow.loadFile(path.join(ROOT,'src','chat.html'));
}
function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) { settingsWindow.show(); settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({ width:620, height:760, frame:false, resizable:true, minWidth:520, minHeight:650, backgroundColor:'#fff9f2', title:'Tiny Pet Settings',
    webPreferences:{ preload:path.join(ROOT,'preload.js'), contextIsolation:true, nodeIntegration:false } });
  settingsWindow.loadFile(path.join(ROOT,'src','settings.html'));
}
function pause(minutes) { state.pausedUntil = minutes === Infinity ? Date.now()+365*86400000 : Date.now()+minutes*60000; persist(); sendState(); }
function resume() { state.pausedUntil = 0; persist(); sendState(); }
function resetPositions() { state.petPosition=null; state.buttonPosition=null; persist(); positionPet(); positionSummon(); sendState(); }

ipcMain.handle('get-state', () => publicState());
ipcMain.handle('save-settings', (_e, patch) => {
  if (patch.apiKey !== undefined) {
    if (patch.apiKey) {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('OS secure storage is unavailable.');
      state.apiKeyEncrypted = safeStorage.encryptString(patch.apiKey).toString('base64');
    } else if (patch.clearApiKey) state.apiKeyEncrypted = '';
    delete patch.apiKey; delete patch.clearApiKey;
  }
  state = { ...state, ...patch };
  persist();
  if (petWindow) petWindow.setAlwaysOnTop(!!state.alwaysOnTop, 'floating');
  if (state.launchOnStartup !== undefined) app.setLoginItemSettings({ openAtLogin: !!state.launchOnStartup });
  positionPet(); setupTimers(); if (!state.enabled) leavePet(); sendState(); return publicState();
});
ipcMain.handle('summon', () => showPet({type:'summon', category:'greeting'}));
ipcMain.handle('hide-pet', () => leavePet());
ipcMain.handle('pause', (_e,m) => pause(m));
ipcMain.handle('resume', () => resume());
ipcMain.handle('open-chat', () => openChat());
ipcMain.handle('open-settings', () => openSettings());
ipcMain.handle('reset-positions', () => resetPositions());
ipcMain.handle('confirm-checkin', () => checkin());
ipcMain.handle('add-task', (_e,title) => { const t={id:Date.now().toString(),title:String(title).trim().slice(0,100),done:false}; if(t.title) state.tasks.unshift(t); persist(); sendState(); return state.tasks; });
ipcMain.handle('toggle-task', (_e,id) => { const t=state.tasks.find(x=>x.id===id); if(t){ t.done=!t.done; if(t.done){state.xp+=5; if(petWindow) petWindow.webContents.send('pet-event',{type:'celebrate',text:pick('celebration')});} persist(); sendState(); } return state.tasks; });
ipcMain.handle('delete-task', (_e,id) => { state.tasks=state.tasks.filter(x=>x.id!==id); persist(); sendState(); return state.tasks; });
ipcMain.handle('move-summon', (_e, delta) => {
  if (!summonWindow) return;
  const [x,y] = summonWindow.getPosition();
  const p = clampPosition(x + Number(delta.dx || 0), y + Number(delta.dy || 0), 54, 54);
  summonWindow.setPosition(p.x, p.y, false);
  state.buttonPosition = p; persist();
  return p;
});

ipcMain.handle('chat', async (_e,{message,history}) => {
  lastActivityAt = Date.now();
  if (state.aiChat && state.apiKeyEncrypted) { try { return { text:await callAI(message,history), mode:'AI' }; } catch(e) { return { text:basicReply(message)+` (AI mode is unavailable right now.)`, mode:'Basic', error:e.message }; } }
  return { text:basicReply(message), mode:'Basic' };
});


ipcMain.on('tinypet:from-dashboard', (event, message) => {
  if (!isTrustedDashboardSender(event) || !message || typeof message.type !== 'string') return;
  const payload = message.payload || {};
  switch (message.type) {
    case 'state:sync': {
      const xp = Number(payload.xp);
      const streak = Number(payload.streak);
      if (Number.isFinite(xp)) state.xp = Math.max(0, Math.floor(xp));
      if (Number.isFinite(streak)) state.streak = Math.max(0, Math.floor(streak));
      persist();
      sendState();
      break;
    }
    case 'settings:update': {
      state.checkins = payload.remindersEnabled !== false;
      if (Number.isFinite(Number(payload.checkInMinutes))) state.checkInInterval = Math.max(5, Number(payload.checkInMinutes));
      if (Number.isFinite(Number(payload.waterMinutes))) state.waterFrequency = Math.max(5, Number(payload.waterMinutes));
      if (payload.quietStart) state.quietStart = String(payload.quietStart).slice(0, 5);
      if (payload.quietEnd) state.quietEnd = String(payload.quietEnd).slice(0, 5);
      persist();
      setupTimers();
      sendState();
      break;
    }
    case 'task:completed': {
      if (petWindow && !petWindow.isDestroyed()) {
        petWindow.webContents.send('pet-event', { type: 'celebrate', text: `+${Math.max(0, Number(payload.xp) || 0)} XP — ${String(payload.title || 'Task completed').slice(0, 100)}!` });
      }
      break;
    }
    case 'pet:say': {
      if (petWindow && !petWindow.isDestroyed()) {
        showPet({ type: 'summon', category: 'greeting', text: String(payload.text || '').slice(0, 240) });
      }
      break;
    }
    case 'pomodoro:start': {
      if (pomodoroTimer) clearTimeout(pomodoroTimer);
      const minutes = Math.max(1, Math.min(240, Number(payload.minutes) || 25));
      if (petWindow && !petWindow.isDestroyed()) petWindow.webContents.send('pet-event', { type: 'show-message', event: { category: 'mood', text: `Focus time. I'll check back in ${minutes} minutes.` } });
      pomodoroTimer = setTimeout(() => {
        if (dashboardWindow && !dashboardWindow.isDestroyed()) dashboardWindow.webContents.send('tinypet:to-dashboard', { type: 'pomodoro:finished' });
        if (petWindow && !petWindow.isDestroyed()) showPet({ type: 'visit', category: 'break', text: 'Focus session finished. Time for a short break.' });
        pomodoroTimer = null;
      }, minutes * 60000);
      break;
    }
    case 'pomodoro:stop': {
      if (pomodoroTimer) clearTimeout(pomodoroTimer);
      pomodoroTimer = null;
      break;
    }
  }
});

app.whenReady().then(() => {
  app.commandLine.appendSwitch('disable-features','CalculateNativeWinOcclusion');
  createPetWindow(); createSummonWindow(); createTray(); positionPet(); positionSummon(); setupTimers();
  if (process.argv.includes('--bring-on-screen')) setTimeout(resetPositions, 500);
  app.on('activate', () => { if (!summonWindow) createSummonWindow(); });
});
app.on('window-all-closed', (e) => { e.preventDefault(); });
app.on('before-quit', () => { persist(); });
