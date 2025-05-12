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

  // Maximize window
  win.maximize();

  // Load the correct URL based on environment
  let url;
  if (isDev) {
    url = 'http://localhost:3000';
  } else {
    // Try multiple paths for build/index.html
    const possiblePaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(__dirname, '../../build/index.html'),
      path.join(app.getAppPath(), 'build/index.html')
    ];
    let filePath;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
      console.warn(`index.html not found at: ${p}`);
    }
    if (!filePath) {
      console.error('Production index.html not found in any paths:', possiblePaths);
      console.error('Current __dirname:', __dirname);
      console.error('App path:', app.getAppPath());
      console.error('Root directory contents:', fs.readdirSync(path.join(__dirname, '../..')));
      console.error('Parent directory contents:', fs.readdirSync(path.join(__dirname, '..')));
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

  // Open DevTools only in development or with --debug
  if (isDev || process.argv.includes('--debug')) {
    console.log('Opening DevTools');
    win.webContents.openDevTools();
  }

  // Handle window focus IPC
  ipcMain.on('focus-window', (event) => {
    if (win && !win.isFocused()) {
      win.focus();
    }
  });

  // Log when page finishes loading
  win.webContents.on('did-finish-load', () => {
    console.log('Page finished loading:', url);
  });

  // Log navigation failures
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

// Log errors during app initialization
app.on('web-contents-created', (event, webContents) => {
  webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details);
  });
  webContents.on('unresponsive', () => {
    console.error('Renderer process became unresponsive');
  });
});