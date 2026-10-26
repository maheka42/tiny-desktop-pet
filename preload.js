const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  getState: () => ipcRenderer.invoke('get-state'),
  saveSettings: (patch) => ipcRenderer.invoke('save-settings', patch),
  summon: () => ipcRenderer.invoke('summon'),
  hidePet: () => ipcRenderer.invoke('hide-pet'),
  pause: (minutes) => ipcRenderer.invoke('pause', minutes),
  resume: () => ipcRenderer.invoke('resume'),
  openChat: () => ipcRenderer.invoke('open-chat'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  resetPositions: () => ipcRenderer.invoke('reset-positions'),
  confirmCheckin: () => ipcRenderer.invoke('confirm-checkin'),
  addTask: (title) => ipcRenderer.invoke('add-task', title),
  toggleTask: (id) => ipcRenderer.invoke('toggle-task', id),
  moveSummon: (delta) => ipcRenderer.invoke('move-summon', delta),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
  chat: (message, history) => ipcRenderer.invoke('chat', { message, history }),
  on: (channel, callback) => {
    const allowed = ['pet-event', 'state-updated'];
    if (!allowed.includes(channel)) return;
    ipcRenderer.on(channel, (_event, data) => callback(data));
  }
});
