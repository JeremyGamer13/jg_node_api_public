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
    // Making the overlay window fullscreen breaks some apps that also want to be in fullscreen.
    // The taskbar will stay visible inside of games if we use real fullscreen.
    const display = electron.screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;
    const win = new electron.BrowserWindow({
        icon: path.join(__dirname, '../../assets/icon_o.png'),
        width,
        height,
        sandbox: false,
        transparent: true,
        resizable: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload-overlay.js'),
            nodeIntegration: true,
            webSecurity: false
        }
    });

    win.setIgnoreMouseEvents(true);
    win.setAlwaysOnTop(true, "screen-saver");
    win.setPosition(0, 0, false);
    win.blur();

    win.loadFile(path.join(__dirname, 'overlay.html'));
    return win;
};
const createOverlayWindowSafe = () => {
    if (overlayWindow) return;

    const window = createOverlayWindow();
    window.on("close", () => {
        overlayWindow = null;
    });

    overlayWindow = window;
    return window;
};

const createHandlers = () => {
    electron.ipcMain.handle("create-overlay-window", () => {
        createOverlayWindowSafe();
    });
    electron.ipcMain.handle("kill-overlay-window", () => {
        if (!overlayWindow) return;
        overlayWindow.close();
    });
    electron.ipcMain.handle("get-overlay-window-selectable", () => {
        if (!overlayWindow) return false;
        return overlayWindow.isAlwaysOnTop();
    });
    electron.ipcMain.handle("update-overlay-window-selectable", (_, selectable) => {
        if (!overlayWindow) return;

        const win = overlayWindow;
        if (selectable) {
            win.setIgnoreMouseEvents(false);
            win.setAlwaysOnTop(false);
            win.focus();
        } else {
            win.setIgnoreMouseEvents(true);
            win.setAlwaysOnTop(true, "screen-saver");
            win.blur();
        }
    });

    electron.ipcMain.handle("delete-file-temp", (_, { path: filePath }) => {
        const tempPath = path.join(__dirname, "../../temp") + path.sep;
        if (!filePath.startsWith(tempPath)) return;

        if (!fs.existsSync(filePath)) return;
        fs.rmSync(filePath);
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

    if (env.getBool("ELECTRON_OVERLAY_WINDOW")) {
        createOverlayWindowSafe();
    }

    return window;
};

module.exports = {
    initialize,
    getWindow: () => globalWindow,
    getOverlayWindow: () => overlayWindow,
    electronExports: electron,
};