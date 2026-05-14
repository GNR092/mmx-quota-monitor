const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  openConfigWindow: () => ipcRenderer.send('open-config-window'),
  closeConfigWindow: () => ipcRenderer.send('close-config-window'),
  refreshQuota: () => ipcRenderer.send('refresh-quota'),
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  onAlwaysOnTopChanged: (callback) => ipcRenderer.on('always-on-top-changed', (event, value) => callback(value)),
  onConfigClosed: (callback) => ipcRenderer.on('config-closed', () => callback()),
  onDoRefreshQuota: (callback) => ipcRenderer.on('do-refresh-quota', () => callback()),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (event, settings) => callback(settings))
});