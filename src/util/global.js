const env = require("./env-util");

class AppGlobal {
    static uptimeStarted = Date.now();
    static isElectron = process.argv0.endsWith("electron.exe");
    static isGoingToReloadALot = process.argv.includes("--jg-reloads-alot");

    static get state() {
        return {
            started: this.uptimeStarted,
            electron: this.isElectron,
            device: env.get("DEVICE_NAME"),
        }
    }
}

module.exports = AppGlobal;