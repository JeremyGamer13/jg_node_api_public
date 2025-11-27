const env = require("./env-util");
const path = require("path");

class AppGlobal {
    static uptimeStarted = Date.now();
    static isElectron = path.basename(process.argv0).startsWith("electron");
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