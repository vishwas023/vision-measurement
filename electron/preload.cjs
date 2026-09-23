const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('easyGauge', {
  platform: process.platform,
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  openImage: () => ipcRenderer.invoke('dialog:openImage'),
  saveMeasurement: (measurement) => ipcRenderer.invoke('measurements:save', measurement),
  listMeasurements: (userId) => ipcRenderer.invoke('measurements:list', userId),
  clearMeasurements: (userId) => ipcRenderer.invoke('measurements:clear', userId)
});
