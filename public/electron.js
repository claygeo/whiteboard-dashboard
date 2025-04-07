const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 800, // Fallback width if not maximized
    height: 600, // Fallback height if not maximized
    webPreferences: {
      nodeIntegration: false, // Disable Node.js access in renderer
      contextIsolation: true, // Enable context isolation
    },
  });
  win.maximize(); // Maximize the window to achieve windowed fullscreen
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});