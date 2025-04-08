const fs = require("fs");
const path = require("path");
const uuid = require("uuid");

const AppGlobal = require("../util/global");
const env = require("../util/env-util");

const electron = require('../electron');

module.exports = async (req, res) => {
    if (!AppGlobal.isElectron) return res.status(403).json({ error: "Host is not using Electron" });
    if (!env.getBool("ALLOW_VIDEO_APIS")) return res.status(403).json({ error: "Disabled on this host" });

    const assetsPath = path.join(__dirname, "../../assets") + path.sep;
    const videoPath = path.join(__dirname, "../../assets/video/" + req.query.path);
    if (!videoPath.startsWith(assetsPath)) return res.status(403).json({ error: "Invalid Video Path" });
    if (!fs.existsSync(videoPath)) return res.status(400).json({ error: "Video does not exist" });

    const window = electron.getOverlayWindow();
    if (!window) return res.status(403).json({ error: "Overlay window is not active" });
    // TODO: Have more video types
    window.webContents.send("play-video-fullscreen", {
        path: videoPath,

        volume: env.getNumber("AUDIO_VOLUME"),
        playbackRate: Number(req.query.speed || 1),
    });

    res.status(200);
    res.json({ success: true });
};