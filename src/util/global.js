class AppGlobal {
    static uptimeStarted = Date.now();
    static isElectron = process.argv0.endsWith("electron.exe");
    static isGoingToReloadALot = process.argv.includes("--jg-reloads-alot");

    static get state() {
        return {
            started: this.uptimeStarted,
            electron: this.isElectron,
        }
    }
}

module.exports = AppGlobal;