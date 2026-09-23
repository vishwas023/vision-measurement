# eSya Easy Gauge

A Windows-ready Electron desktop application for visual measurement. It combines a React interface, live camera and image measurement tools, configurable ROI shapes, calibration, and SQLite-backed local history.

## Features

- Secure local login backed by SQLite (`better-sqlite3`)
- Image import and live USB/web camera view
- Rectangle, square, and circle ROI drawing
- Width, height, diameter, and raw pixel measurements
- Configurable pixels-per-unit calibration (mm, cm, in, px)
- Persistent per-user measurement history
- Context-isolated Electron IPC architecture
- Windows NSIS installer configuration

## Quick start

Requirements: Node.js 20+ and npm. On Windows, use PowerShell or Command Prompt.

```bash
npm install
npm run dev
```

Demo login:

- Username: `admin`
- Password: `admin123`

The local database is created automatically in Electron's application data folder. No database server is required.

## Production build

```bash
npm run dist
```

The Windows x64 NSIS installer is written to `release/eSya-Easy-Gauge-Setup-1.0.0.exe`. Run the Windows build command on Windows (or a properly configured Windows build CI host).

To test the production application without creating an installer:

```bash
npm run build
npm start
```

## Project structure

- `electron/main.cjs` — Electron lifecycle, SQLite schema, authentication, dialogs and IPC
- `electron/preload.cjs` — restricted renderer API bridge
- `src/` — React user interface and measurement canvas
- `vite.config.js` — renderer build configuration
- `package.json` — scripts, dependencies and Windows packaging settings

## Camera permissions

Windows may prompt for camera permission on first use. If access is denied, enable camera access for desktop apps in **Settings → Privacy & security → Camera**.
