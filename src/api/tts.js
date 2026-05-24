const fs = require("fs");
const path = require("path");
const util = require("util");
const childProcess = require("child_process");

const AppGlobal = require("../util/global");
const env = require("../util/env-util");

const gTTS = require('gtts');
const uuid = require("uuid");
const electron = require('../electron');

const execFilePromise = util.promisify(childProcess.execFile);

const ttseSpeakNG = async (textPath, lang, filePath) => {
    const [executable, ...args] = env.get("TTS_ESPEAKNG_COMMAND").split("|");
    if (!executable) throw new Error("Not implemented");
    const realArgs = args.map(argument => argument
        .replace("{{LANG}}", lang)
        .replace("{{NAME}}", lang) // espeak-ng doesnt have voice names
        .replace("{{TEXT_FILE}}", textPath)
        .replace("{{TEMP_FILE}}", filePath));
    await execFilePromise(executable, realArgs);
};
const ttsBalabolka = async (textPath, lang, name, filePath) => {
    const [executable, ...args] = env.get("TTS_BALABOLKA_COMMAND").split("|");
    if (!executable) throw new Error("Not implemented");

    // fix up args
    const argLang = args.find(argument => argument.includes("-id"));
    if (!lang && argLang) args.splice(args.indexOf(argLang), 1);
    const argName = args.find(argument => argument.includes("-n"));
    if (!name && argName) args.splice(args.indexOf(argName), 1); 

    // TODO: See if we need to translate language codes like "en" to language IDs like 1033
    // non-standard balabolka voices
    switch (name) {
        case "x-BonziBUDDY":
            name = "Adult Male #2";
            args.unshift("-p", "40");
            break;
    }

    const realArgs = args.map(argument => argument
        .replace("{{LANG}}", lang)
        .replace("{{NAME}}", name)
        .replace("{{TEXT_FILE}}", textPath)
        .replace("{{TEMP_FILE}}", filePath));
    await execFilePromise(executable, realArgs);
};

module.exports = {
    method: "get",
    request: async (req, res) => {
        if (!env.getBool("ALLOW_COMPUTER_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_NETWORK_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_FILE_TEMP_APIS")) return res.status(403).json({ error: "Disabled on this host" });

        const text = req.query.text;
        const lang = req.query.lang || "en";
        const model = req.query.model || "google";
        const name = req.query.name || "";
        if (!text || typeof text !== 'string') {
            return res.status(400)
                .json({
                    error: "Provide some text",
                    example: "/tts?text=Wow%20so%20cool"
                });
        }
        if (text.length > 1024) return res.status(400).json({ error: "Text is too long"});

        // tts
        const id = uuid.v4();
        const playAudio = String(req.query.play) === "true";
        const ttsPath = path.join(__dirname, `../../temp/tts_${id}.${model === "google" ? "mp3" : "wav"}`);
        const textPath = path.join(__dirname, `../../temp/tts_${id}.txt`);
        try {
            switch (model) {
                // NOTE: for google we can take advantage of streaming the output from gtts directly to avoid temp files
                // NOTE: im pretty sure google tts outputs mp3 only by the structure of this code, could be wrong
                case "google": {
                    const gtts = new gTTS(text, lang);
                    if (!playAudio) {
                        res.status(200);
                        res.setHeader('Content-Type', 'audio/mp3');
                        gtts.stream().pipe(res);
                        return;
                    }

                    await new Promise((resolve, reject) => {
                        gtts.save(ttsPath, (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });
                    break;
                }
                // the other models
                case "espeak-ng":
                    if (!env.getBool("ALLOW_OPERATING_SYSTEM_APIS")) return res.status(403).json({ error: "Disabled on this host" });
                    fs.writeFileSync(textPath, text, "utf8");
                    await ttseSpeakNG(textPath, lang, ttsPath);
                    break;
                case "balabolka":
                    if (!env.getBool("ALLOW_OPERATING_SYSTEM_APIS")) return res.status(403).json({ error: "Disabled on this host" });
                    fs.writeFileSync(textPath, text, "utf8");
                    await ttsBalabolka(textPath, lang, name, ttsPath);
                    break;
                default:
                    return res.status(400).json({ error: "Invalid model" });
            }
        } catch (err) {
            if (fs.existsSync(textPath)) fs.rmSync(textPath);
            return res.status(400).json({ error: String(err) });
        }

        // NOTE: google will be handled here since we do gtts.save above if we arent playing audio
        // NOTE: we trust the server to have made a real temp file in the temp dir at ttsPath
        if (fs.existsSync(textPath)) fs.rmSync(textPath); // we do not need the text file after TTS has read it aloud
        if (playAudio) {
            if (!AppGlobal.isElectron) return res.status(403).json({ error: "Host is not using Electron" });
            if (!env.getBool("ALLOW_AUDIO_APIS")) return res.status(403).json({ error: "Disabled on this host" });

            const window = electron.getWindow();
            window.webContents.send("play-audio-normal", {
                path: ttsPath,
                temp: true, // deletes on end

                volume: env.getNumber("AUDIO_VOLUME"),
                playbackRate: Number(req.query.speed || 1),
            });

            res.status(200);
            res.json({ success: true });
            return;
        }

        // NOTE: google tts is not handled here
        res.status(200);
        res.setHeader('Content-Type', 'audio/wav');
        res.sendFile(ttsPath, () => {
            if (fs.existsSync(ttsPath)) fs.rmSync(ttsPath);
            if (fs.existsSync(textPath)) fs.rmSync(textPath);
        });
    }
};