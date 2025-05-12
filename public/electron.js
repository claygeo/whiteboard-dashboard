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
    // Verify preload.js exists
    const preloadPath = path.join(__dirname, 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      console.error(`preload.js not found at: ${preloadPath}`);
      app.quit();
      return;
    }

    // Try primary path for build/index.html
    const filePath = path.join(__dirname, '../build/index.html');
    if (!fs.existsSync(filePath)) {
      console.error(`Production index.html not found at: ${filePath}`);
      console.error('Current __dirname:', __dirname);
      console.error('App path:', app.getAppPath());
      try {
        console.error('Root directory contents:', fs.readdirSync(path.join(__dirname, '../..')) || []);
        console.error('Parent directory contents:', fs.readdirSync(path.join(__dirname, '..')) || []);
        console.error('App path contents:', fs.readdirSync(app.getAppPath()) || []);
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

  // Open DevTools in development or with --debug
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