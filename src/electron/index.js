const fs = require("fs");
const path = require("path");

const env = require("../util/env-util");

const electron = require('electron');

/**
 * @type {electron.BrowserWindow}
 */
let globalWindow;
/**
 * @type {electron.BrowserWindow}
 */
let overlayWindow;
let shuttingDown = false;

const createWindow = () => {
    const win = new electron.BrowserWindow({
        icon: path.join(__dirname, '../../assets/icon.png'),
        width: 720,
        height: 640,
        sandbox: false,
        show: !(env.getBool("ELECTRON_TRAY") && env.getBool("ELECTRON_TRAY_START")),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            webSecurity: false
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    return win;
};
const createOverlayWindow = () => {
    const win = new electron.BrowserWindow({
        icon: path.join(__dirname, '../../assets/icon_o.png'),
        width: 720,
        height: 640,
        sandbox: false,
        transparent: true,
        frame: false,
        fullscreen: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload-overlay.js'),
            nodeIntegration: true,
            webSecurity: false
        }
    });

    win.setIgnoreMouseEvents(true);
    win.setAlwaysOnTop(true);
    win.blur();

    win.loadFile(path.join(__dirname, 'overlay.html'));
    return win;
};

const createHandlers = () => {
    electron.ipcMain.handle("delete-file-temp", (_, { path:filePath }) => {
        const tempPath = path.join(__dirname, "../../temp") + path.sep;
        if (!filePath.startsWith(tempPath)) return;

        if (!fs.existsSync(filePath)) return;
        fs.rmSync(filePath);
    });
    electron.ipcMain.handle("create-overlay-window", () => {
        if (overlayWindow) return;

        const win = createOverlayWindow();
        overlayWindow = win;
        win.on("close", () => {
            overlayWindow = null;
        });
    });
    electron.ipcMain.handle("kill-overlay-window", () => {
        if (!overlayWindow) return;
        overlayWindow.close();
    });
};
const createSystemTray = () => {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    const icon = electron.nativeImage.createFromPath(iconPath);
    const tray = new electron.Tray(icon);

    tray.setToolTip('jg_node_api | this is the app making the random ass noises btw');
    tray.setTitle('jg_node_api');

    const contextMenu = electron.Menu.buildFromTemplate([
        { label: 'Show Window', type: 'normal', click: () => {
            globalWindow.show();
        } },
        { label: 'Close', type: 'normal', click: () => {
            shuttingDown = true;
            electron.app.quit();
        } },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
        globalWindow.show();
    });

    electron.app.on('before-quit', () => {
        tray.destroy();
    });
};
const initialize = async () => {
    await electron.app.whenReady();
    electron.app.setAppUserModelId('com.jeremygamer13.jgnodeapi');

    const window = createWindow();
    globalWindow = window;

    createHandlers();
    electron.app.on('window-all-closed', () => {
        if (!env.getBool("ELECTRON_TRAY")) {
            shuttingDown = true;
            if (process.platform !== 'darwin') electron.app.quit();
            return;
        }
    });

    if (env.getBool("ELECTRON_TRAY")) {
        createSystemTray(window);
        window.on("close", (event) => {
            if (shuttingDown) return;
            event.preventDefault();
            window.hide();
        });
    }

    if (env.getBool("ELECTRON_NOTIFICATION")) {
        const iconPath = path.join(__dirname, '../../assets/icon.png');
        const icon = electron.nativeImage.createFromPath(iconPath);

        const notification = new electron.Notification({
            title: "Oy oy oy!",
            body: env.getBool("ELECTRON_TRAY") ?
                "jg_node_api is ON!!! Close in system tray to exit" :
                "jg_node_api is ON!!! Close window to exit",
            icon,
        });

        notification.show();
    }

    return window;
};

module.exports = {
    initialize,
    getWindow: () => globalWindow,
    getOverlayWindow: () => overlayWindow,
};