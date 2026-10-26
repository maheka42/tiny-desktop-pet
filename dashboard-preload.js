const { contextBridge, ipcRenderer } = require('electron');

const allowedOutbound = new Set([
  'state:sync',
  'settings:update',
  'task:completed',
  'pet:say',
  'pomodoro:start',
  'pomodoro:stop',
]);

contextBridge.exposeInMainWorld('tinyPet', {
  version: 1,
  send(message) {
    if (!message || !allowedOutbound.has(message.type)) return;
    ipcRenderer.send('tinypet:from-dashboard', message);
  },
  onMessage(callback) {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, message) => callback(message);
    ipcRenderer.on('tinypet:to-dashboard', handler);
    return () => ipcRenderer.removeListener('tinypet:to-dashboard', handler);
  },
});
