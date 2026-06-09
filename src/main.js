const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, screen, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let configWindow;
let tray;
let isQuitting = false;

const createWindow = () => {
  const savedBounds = store.get('windowBounds') || {};
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  const defaultX = screenWidth - 340;
  const defaultY = 20;

  mainWindow = new BrowserWindow({
    width: savedBounds.width || 400,
    height: savedBounds.height || 550,
    x: savedBounds.x !== undefined ? savedBounds.x : defaultX,
    y: savedBounds.y !== undefined ? savedBounds.y : defaultY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('moved', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  mainWindow.on('resized', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });
};

const createTray = () => {
  const iconPath = path.join(__dirname, 'renderer', 'assets', 'icon.png');
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => mainWindow.show() },
    { label: 'Ocultar', click: () => mainWindow.hide() },
    { type: 'separator' },
    { label: 'Siempre visible: ON', click: () => toggleAlwaysOnTop() },
    { label: 'Transparente: OFF', click: () => toggleTransparency() },
    { type: 'separator' },
    { label: 'Salir', click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('MMX Quota Monitor');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  ipcMain.on('close-window', () => {
    isQuitting = true;
    app.quit();
  });

  ipcMain.on('hide-window', () => {
    mainWindow.hide();
  });

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('toggle-always-on-top', () => {
    toggleAlwaysOnTop();
  });

  ipcMain.on('refresh-quota', () => {
    mainWindow.webContents.send('do-refresh-quota');
  });

  ipcMain.on('save-settings', (event, settings) => {
    Object.keys(settings).forEach(key => {
      store.set(key, settings[key]);
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('settings-updated', settings);
    }
  });

  ipcMain.handle('get-settings', () => {
    return store.store;
  });

  ipcMain.on('open-config-window', () => {
    if (configWindow) {
      configWindow.focus();
      return;
    }

    configWindow = new BrowserWindow({
      width: 320,
      height: 550,
      resizable: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    configWindow.loadFile(path.join(__dirname, 'renderer', 'config.html'));

    configWindow.on('closed', () => {
      configWindow = null;
      mainWindow.webContents.send('config-closed');
    });
  });

  ipcMain.on('close-config-window', () => {
    if (configWindow) {
      configWindow.close();
    }
  });
};

let alwaysOnTop = true;
let isTransparent = false;

const toggleTransparency = () => {
  isTransparent = !isTransparent;
  if (isTransparent) {
    mainWindow.setOpacity(0.15);
  } else {
    mainWindow.setOpacity(1);
  }
};

app.whenReady().then(() => {
  createWindow();
  createTray();

  globalShortcut.register('CommandOrControl+Shift+M', () => {
    toggleTransparency();
  });

  ipcMain.on('toggle-transparency', () => {
    toggleTransparency();
  });

  // Fallback via before-input-event (captura teclas antes del DOM)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.controlKey && input.shiftKey && (input.code === 'KeyM' || input.key === 'M')) {
      toggleTransparency();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});