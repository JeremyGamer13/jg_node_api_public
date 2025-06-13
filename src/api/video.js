const fs = require("fs");
const path = require("path");
const uuid = require("uuid");

const AppGlobal = require("../util/global");
const env = require("../util/env-util");

const electron = require('../electron');
const windows = require('../util/windows.js');

module.exports = {
    method: "get",
    request: async (req, res) => {
        if (!AppGlobal.isElectron) return res.status(403).json({ error: "Host is not using Electron" });
        if (!env.getBool("ALLOW_COMPUTER_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_VIDEO_APIS")) return res.status(403).json({ error: "Disabled on this host" });

        const assetsPath = path.join(__dirname, "../../assets") + path.sep;
        const videoPath = path.join(__dirname, "../../assets/video/" + req.query.path);
        if (!videoPath.startsWith(assetsPath)) return res.status(403).json({ error: "Invalid Video Path" });
        if (!fs.existsSync(videoPath)) return res.status(400).json({ error: "Video does not exist" });

        const window = electron.getOverlayWindow();
        if (!window) return res.status(403).json({ error: "Overlay window is not active" });

        // TODO: Have a type that defines a video position, rotation, and scale.
        switch (req.query.type) {
            case "fullscreen-with-screenshot": {
                if (!env.getBool("ALLOW_WINDOWS_APIS")) return res.status(403).json({ error: "Disabled on this host" });
                const screenshot = await windows.screenshot(true);
                const dataUrl = "data:image/png;base64," + screenshot.toString("base64");
                window.webContents.send("play-video-fullscreen-with-image", {
                    path: videoPath,

                    volume: Math.min(Number(req.query.volume || 1), 1) * env.getNumber("AUDIO_VOLUME"),
                    playbackRate: Number(req.query.speed || 1),

                    imageUrl: dataUrl,
                    // CSS percentages
                    imageX: Number(req.query.x || 0),
                    imageY: Number(req.query.y || 0),
                    imageWidth: Number(req.query.width || 100),
                    imageHeight: Number(req.query.height || 100),
                });
            }
            default: {
                window.webContents.send("play-video-fullscreen", {
                    path: videoPath,

                    volume: Math.min(Number(req.query.volume || 1), 1) * env.getNumber("AUDIO_VOLUME"),
                    playbackRate: Number(req.query.speed || 1),
                });
                break;
            }
        }

        res.status(200);
        res.json({ success: true });
    }
};