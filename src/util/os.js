const AppGlobal = require("../util/global");
const env = require("./env-util");
const electron = require('../electron');

const Canvas = require("canvas");
const screenshotDesktop = require('screenshot-desktop');

class OperatingSystem {
    static async screenshot(onlyElectronWorkingArea) {
        if (!env.getBool("ALLOW_OPERATING_SYSTEM_APIS")) {
            throw new Error("Disabled");
        }

        const buffer = await screenshotDesktop({
            format: "png"
        });

        if (onlyElectronWorkingArea) {
            if (!AppGlobal.isElectron) {
                throw new Error("NotElectron");
            }

            const display = electron.electronExports.screen.getPrimaryDisplay();
            const { x, y, width, height } = display.workArea;
            const canvas = Canvas.createCanvas(width, height);
            const ctx = canvas.getContext("2d");
            const image = await Canvas.loadImage(buffer);
            ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
            return canvas.toBuffer("image/png");
        }

        return buffer;
    }
}

module.exports = OperatingSystem;