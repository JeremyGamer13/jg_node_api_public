const AppGlobal = require("../util/global");
const env = require("./env-util");
const electron = require('../electron');

const { Jimp } = require("jimp");
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
        let finalBuffer = buffer;

        if (onlyElectronWorkingArea) {
            if (!AppGlobal.isElectron) {
                throw new Error("NotElectron");
            }

            const display = electron.electronExports.screen.getPrimaryDisplay();
            const x = Math.ceil(display.workArea.x * display.scaleFactor);
            const y = Math.ceil(display.workArea.y * display.scaleFactor);
            const width = Math.floor(display.workArea.width * display.scaleFactor);
            const height = Math.floor(display.workArea.height * display.scaleFactor);
            const canvas = Canvas.createCanvas(width, height);
            const ctx = canvas.getContext("2d");
            const image = await Canvas.loadImage(buffer);
            ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
            finalBuffer = canvas.toBuffer("image/png");
        }

        return finalBuffer;
    }
}

module.exports = OperatingSystem;