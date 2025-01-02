const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// Simple development mode check
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

/**
 * Creates the main application window
 * Configures window properties and loads the React app
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    // Use native window frame on macOS, custom frame on other platforms
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    frame: process.platform === 'darwin'
  })

  // Load React app - development or production URL
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, './index.html')}`
  )

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

// Create window when Electron is ready
app.whenReady().then(createWindow)

// Quit application when all windows are closed (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Create a new window if none exists when app is activated (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})