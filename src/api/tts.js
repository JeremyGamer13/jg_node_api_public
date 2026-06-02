const fs = require("fs");
const path = require("path");
const util = require("util");
const childProcess = require("child_process");

const env = require("../util/env-util");
const electron = require('../electron');
const AppGlobal = require("../util/global");

const gTTS = require('gtts');
const uuid = require("uuid");
const mime = require("mime");
const lcid = require("../util/lcid");

const execPromise = util.promisify(childProcess.exec);
const execFilePromise = util.promisify(childProcess.execFile);

const ttsGoogle = async (text, { id, lang }) => {
    const ttsPath = path.join(__dirname, `../../temp/tts_${id}.mp3`);
    const gtts = new gTTS(text, lang);

    // save the file
    await new Promise((resolve, reject) => {
        gtts.save(ttsPath, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
    return [ttsPath, "audio/mp3"];
}
const ttseSpeakNG = async (text, { id, lang }) => {
    if (!env.getBool("ALLOW_OPERATING_SYSTEM_APIS")) throw new Error("Disabled");
    const ttsPath = path.join(__dirname, `../../temp/tts_${id}.wav`);
    const textPath = path.join(__dirname, `../../temp/tts_${id}.txt`);
    const [executable, ...args] = env.get("TTS_ESPEAKNG_COMMAND").split("|");
    if (!executable) throw new Error("Disabled");

    fs.writeFileSync(textPath, text, "utf8");
    try {
        const realArgs = args.map(argument => argument
            .replace("{{LANG}}", lang)
            .replace("{{NAME}}", lang) // espeak-ng doesnt have voice names
            .replace("{{TEXT_FILE}}", textPath)
            .replace("{{TEMP_FILE}}", ttsPath));
        await execFilePromise(executable, realArgs);
    } finally {
        fs.rmSync(textPath);
    }
    return [ttsPath, "audio/wav"];
};
const ttsBalabolka = async (text, { id, lang, name }) => {
    if (!env.getBool("ALLOW_OPERATING_SYSTEM_APIS")) throw new Error("Disabled");
    const ttsPath = path.join(__dirname, `../../temp/tts_${id}.wav`);
    const textPath = path.join(__dirname, `../../temp/tts_${id}.txt`);
    const [executable, ...args] = env.get("TTS_BALABOLKA_COMMAND").split("|");
    if (!executable) throw new Error("Disabled");

    // fix up args
    const argLang = args.find(argument => argument.includes("-id"));
    if (!lang && argLang) args.splice(args.indexOf(argLang), 1);
    const argName = args.find(argument => argument.includes("-n"));
    if (!name && argName) args.splice(args.indexOf(argName), 1);

    // get lang to be windows
    let windowsLang = 1033;
    try {
        const locale = new Intl.Locale("en");
        const maximized = locale.maximize();
        const langName = `${locale.language}_${locale.region}`;
        windowsLang = lcid.to(langName) || 1033;
    } catch {
        windowsLang = 1033;
    }

    // non-standard balabolka voices
    switch (name) {
        case "x-BonziBUDDY":
            name = "Adult Male #2";
            args.unshift("-p", "40");
            break;
    }

    fs.writeFileSync(textPath, text, "utf8");
    try {
        const realArgs = args.map(argument => argument
            .replace("{{LANG}}", windowsLang)
            .replace("{{NAME}}", name)
            .replace("{{TEXT_FILE}}", textPath)
            .replace("{{TEMP_FILE}}", ttsPath));
        await execFilePromise(executable, realArgs);
    } finally {
        fs.rmSync(textPath);
    }
    return [ttsPath, "audio/wav"];
};

module.exports = {
    method: "get",
    request: async (req, res) => {
        if (!env.getBool("ALLOW_COMPUTER_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_NETWORK_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_FILE_TEMP_APIS")) return res.status(403).json({ error: "Disabled on this host" });

        // TTS options
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

        // output options
        const playAudio = String(req.query.play) === "true";
        const playSpeed = Number(req.query.playspeed || 1);

        // tts
        let filePath = null;
        let fileMime = null;
        const id = uuid.v4();
        const enforceMp3 = env.get("FFMPEG_EXEC") && env.getBool("TTS_FFMPEG_MP3");
        try {
            switch (model) {
                case "google":
                    [filePath, fileMime] = await ttsGoogle(text, { id, lang, name });
                    break;
                case "espeak-ng":
                    [filePath, fileMime] = await ttseSpeakNG(text, { id, lang, name });
                    break;
                case "balabolka":
                    [filePath, fileMime] = await ttsBalabolka(text, { id, lang, name });
                    break;
                default:
                    return res.status(400).json({ error: "Invalid model" });
            }
            if (enforceMp3 && mime.getExtension(fileMime) !== "mp3") {
                const mp3Path = path.join(__dirname, `../../temp/ttsmp3_${id}.mp3`);
                const command = `${env.get("FFMPEG_EXEC")} -y -i "${filePath}" -map_metadata -1 -vn -c:a libmp3lame "${mp3Path}"`;
                await execPromise(command);
                fs.rmSync(filePath);

                filePath = mp3Path;
                fileMime = "audio/mp3";
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: String(err) });
        }

        if (playAudio) {
            if (!AppGlobal.isElectron) return res.status(403).json({ error: "Host is not using Electron" });
            if (!env.getBool("ALLOW_AUDIO_APIS")) return res.status(403).json({ error: "Disabled on this host" });

            const window = electron.getWindow();
            window.webContents.send("play-audio-normal", {
                path: filePath,
                temp: true, // deletes on end

                volume: env.getNumber("AUDIO_VOLUME"),
                playbackRate: playSpeed,
            });

            res.status(200);
            res.json({ success: true });
            return;
        }

        res.status(200);
        res.setHeader('Content-Type', fileMime);
        res.setHeader('Cache-Control', "public, max-age=86400");
        res.sendFile(filePath, () => {
            if (fs.existsSync(filePath)) fs.rmSync(filePath);
        });
    }
};