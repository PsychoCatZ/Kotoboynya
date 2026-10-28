const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kotoboynyaDesktop', {
  isDesktop: true,
  exit: () => ipcRenderer.send('app:exit'),
})
