const fs = require("fs");
const path = require("path");
const uuid = require("uuid");

const AppGlobal = require("../util/global");
const env = require("../util/env-util");

const electron = require('../electron');

module.exports = async (req, res) => {
    if (!AppGlobal.isElectron) return res.status(403).json({ error: "Host is not using Electron" });
    if (!env.getBool("ALLOW_AUDIO_APIS")) return res.status(403).json({ error: "Disabled on this host" });

    const assetsPath = path.join(__dirname, "../../assets") + path.sep;
    const audioPath = path.join(__dirname, "../../assets/audio/" + req.query.path);
    if (!audioPath.startsWith(assetsPath)) return res.status(403).json({ error: "Invalid Sound Path" });
    if (!fs.existsSync(audioPath)) return res.status(400).json({ error: "Sound does not exist" });

    const window = electron.getWindow();
    window.webContents.send("play-audio-normal", {
        path: audioPath,

        volume: env.getNumber("AUDIO_VOLUME"),
        playbackRate: Number(req.query.speed || 1),
    });

    res.status(200);
    res.json({ success: true });
};