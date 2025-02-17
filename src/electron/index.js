const fs = require("fs");
const path = require("path");

const env = require("../util/env-util");

const { app, BrowserWindow, ipcMain } = require('electron');

/**
 * @type {BrowserWindow}
 */
let globalWindow = null;
const createWindow = () => {
    const win = new BrowserWindow({
        width: 640,
        height: 360,
        sandbox: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            webSecurity: false
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    return win;
};

const createHandlers = () => {
    ipcMain.handle("delete-file-temp", (_, { path:filePath }) => {
        const tempPath = path.join(__dirname, "../../temp") + path.sep;
        if (!filePath.startsWith(tempPath)) return;

        if (!fs.existsSync(filePath)) return;
        fs.rmSync(filePath);
    });
};
const initialize = async () => {
    await app.whenReady();
    const window = createWindow();
    globalWindow = window;

    createHandlers();
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    return window;
};

module.exports = {
    initialize,
    getWindow: () => globalWindow,
};