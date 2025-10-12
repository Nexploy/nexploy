const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: async () => {
        return await ipcRenderer.invoke('get-app-version');
    },
});
