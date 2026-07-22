/**
 * Kaizen CRM desktop shell.
 *
 * Boots the bundled Next.js standalone server (using Electron's own binary
 * as Node via ELECTRON_RUN_AS_NODE) and opens the app in a window. The
 * database connection string is configured on first run inside the app UI
 * and stored in the OS user-data folder.
 */
const { app, BrowserWindow, shell, dialog } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

let serverProcess = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function startServer(port) {
  const serverDir = path.join(process.resourcesPath, "server");
  serverProcess = spawn(process.execPath, [path.join(serverDir, "server.js")], {
    cwd: serverDir,
    stdio: "ignore",
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      KAIZEN_DATA_DIR: app.getPath("userData"),
      KAIZEN_MIGRATIONS_DIR: path.join(serverDir, "db", "migrations"),
    },
  });
  serverProcess.on("exit", (code) => {
    serverProcess = null;
    if (code !== 0 && !app.isQuitting) {
      dialog.showErrorBox("Kaizen CRM", `The local server stopped unexpectedly (code ${code}).`);
      app.quit();
    }
  });
}

function waitForServer(port, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get({ host: "127.0.0.1", port, path: "/" }, (res) => {
        res.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) reject(new Error("Server did not start in time"));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

async function createWindow() {
  const port = Number(process.env.KAIZEN_PORT) || (await findFreePort());
  startServer(port);
  await waitForServer(port);

  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Kaizen CRM",
    autoHideMenuBar: true,
    backgroundColor: "#fcfcfb",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  // External links (company websites, LinkedIn) open in the real browser.
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await window.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(() =>
  createWindow().catch((error) => {
    dialog.showErrorBox("Kaizen CRM", `Failed to start: ${error.message}`);
    app.quit();
  })
);

app.on("before-quit", () => {
  app.isQuitting = true;
  if (serverProcess) serverProcess.kill();
});

app.on("window-all-closed", () => {
  app.quit();
});
