const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.maximize();

  let url;
  if (isDev) {
    url = 'http://localhost:3000';
  } else {
    const preloadPath = path.join(__dirname, 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      console.error(`preload.js not found at: ${preloadPath}`);
      app.quit();
      return;
    }

    const filePath = path.join(app.getAppPath(), 'build', 'index.html');
    console.log('Attempting to load:', filePath);
    if (!fs.existsSync(filePath)) {
      console.error(`Production index.html not found at: ${filePath}`);
      console.error('Current __dirname:', __dirname);
      console.error('App path:', app.getAppPath());
      try {
        console.error('Root directory contents:', fs.readdirSync(path.dirname(app.getAppPath())) || []);
        console.error('Build directory contents:', fs.readdirSync(path.join(app.getAppPath(), 'build')) || []);
      } catch (err) {
        console.error('Error reading directories:', err);
      }
      app.quit();
      return;
    }
    url = `file://${filePath}`;
  }

  console.log(`Environment: ${isDev ? 'Development' : 'Production'}, Loading URL: ${url}`);

  win.loadURL(url).catch((err) => {
    console.error('Failed to load URL:', err);
    app.quit();
  });

  console.log('Opening DevTools');
  win.webContents.openDevTools();

  ipcMain.on('focus-window', (event) => {
    if (win && !win.isFocused()) {
      win.focus();
    }
  });

  win.webContents.on('did-finish-load', () => {
    console.log('Page finished loading:', url);
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}: ${errorCode} - ${errorDescription}`);
  });
}

app.whenReady().then(() => {
  createWindow();
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

app.on('web-contents-created', (event, webContents) => {
  webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details);
  });
  webContents.on('unresponsive', () => {
    console.error('Renderer process became unresponsive');
  });
});