const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

let mainWindow;
let db;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, original] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(candidate, Buffer.from(original, 'hex'));
}

function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'easy-gauge.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      image_name TEXT,
      shape TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width_px REAL NOT NULL,
      height_px REAL NOT NULL,
      width_unit REAL NOT NULL,
      height_unit REAL NOT NULL,
      unit TEXT NOT NULL,
      pixels_per_unit REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!exists) {
    db.prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)')
      .run('admin', hashPassword('admin123'), 'Gauge Operator');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#f4f7f9',
    title: 'eSya Easy Gauge',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (db) db.close(); });

ipcMain.handle('auth:login', (_event, { username, password }) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username || '').trim());
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return { ok: false, error: 'Incorrect username or password.' };
  }
  return { ok: true, user: { id: user.id, username: user.username, displayName: user.display_name } };
});

ipcMain.handle('dialog:openImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select an image to measure',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'tif', 'tiff'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const extension = path.extname(filePath).slice(1).toLowerCase().replace('jpg', 'jpeg');
  return { name: path.basename(filePath), dataUrl: `data:image/${extension};base64,${fs.readFileSync(filePath).toString('base64')}` };
});

ipcMain.handle('measurements:save', (_event, item) => {
  const stmt = db.prepare(`INSERT INTO measurements
    (user_id, image_name, shape, x, y, width_px, height_px, width_unit, height_unit, unit, pixels_per_unit)
    VALUES (@userId, @imageName, @shape, @x, @y, @widthPx, @heightPx, @widthUnit, @heightUnit, @unit, @pixelsPerUnit)`);
  const result = stmt.run(item);
  return { ok: true, id: Number(result.lastInsertRowid) };
});

ipcMain.handle('measurements:list', (_event, userId) => db.prepare(`
  SELECT id, image_name AS imageName, shape, width_px AS widthPx, height_px AS heightPx,
    width_unit AS widthUnit, height_unit AS heightUnit, unit, created_at AS createdAt
  FROM measurements WHERE user_id = ? ORDER BY id DESC LIMIT 50`).all(userId));

ipcMain.handle('measurements:clear', (_event, userId) => {
  db.prepare('DELETE FROM measurements WHERE user_id = ?').run(userId);
  return { ok: true };
});
