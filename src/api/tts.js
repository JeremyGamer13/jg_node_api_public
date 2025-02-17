const fs = require("fs");
const path = require("path");
const uuid = require("uuid");

const AppGlobal = require("../util/global");
const env = require("../util/env-util");

const gTTS = require('gtts');
const electron = require('../electron');

module.exports = async (req, res) => {
    const playAudio = String(req.query.play) === "true";
    const text = req.query.text;
    if (!text || typeof text !== 'string') {
        return res.status(400)
            .json({
                error: "Provide some text",
                example: "/tts?text=Wow%20so%20cool"
            });
    }
    if (text.length > 512) {
        return res.status(400)
            .json({
                error: "Text is too long"
            });
    }
    let lang = req.query.lang;
    if (!lang || typeof lang !== 'string') {
        lang = 'en';
    }

    let gtts;
    try {
        gtts = new gTTS(text, lang);
    } catch (err) {
        return res.status(400)
            .json({
                error: String(err)
            });
    }

    if (playAudio) {
        if (!AppGlobal.isElectron) return res.status(403).json({ error: "Host is not using Electron" });
        if (!env.getBool("ALLOW_AUDIO_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_FILE_TEMP_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        
        const id = uuid.v4();
        const ttsPath = path.join(__dirname, `../../temp/tts_${id}.mp3`);
        gtts.save(ttsPath, (err) => {
            if (err) {
                res.status(500);
                res.json({ error: String(err) });
                return;
            }

            const window = electron.getWindow();
            window.webContents.send("play-audio-normal", {
                path: ttsPath,
                temp: true, // deletes on end

                volume: env.getNumber("AUDIO_VOLUME"),
                playbackRate: 1,
            });

            res.status(200);
            res.json({ success: true });
        });

        return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'audio/mp3');
    gtts.stream().pipe(res);
};