const fs = require("fs");
const path = require("path");
const util = require("util");
const childProcess = require("child_process");

const env = require("../util/env-util");
const AppGlobal = require("../util/global");

const uuid = require("uuid");
const mime = require("mime");

const execFilePromise = util.promisify(childProcess.execFile);

// NOTE: This endpoint is developed with the intention of allowing any output type (mp3, ogg, mp4, etc) & any input URL (so youtube URL, youtube ID, twitter, etc). All platform & type restrictions are up to the .env
const probeOutput = async (inputPart, outputDirectory) => {
    // NOTE: This shares an outputDirectory with makeOutputFile
    const batchFile = path.join(outputDirectory, `./ytdlp-url-batch-file-probe.txt`);
    const [executable, ...args] = env.get("YTDLP_COMMAND_PROBE").split("|");
    if (!executable) throw new Error("Disabled");

    fs.writeFileSync(batchFile, inputPart, "utf8");
    const realArgs = args.map(argument => argument
        .replace("{{INPUT_PATH}}", batchFile));
    const process = await execFilePromise(executable, realArgs, {
        cwd: outputDirectory
    });
    const jsonString = process.stdout.trim();
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
};
const makeOutputFile = async (inputPart, outputDirectory) => {
    // NOTE: This shares an outputDirectory with probeOutput
    const batchFile = path.join(outputDirectory, `./ytdlp-url-batch-file-output.txt`);
    const [executable, ...args] = env.get("YTDLP_COMMAND_DOWNLOAD").split("|");
    if (!executable) throw new Error("Disabled");

    fs.writeFileSync(batchFile, inputPart, "utf8");
    const realArgs = args.map(argument => argument
        .replace("{{INPUT_PATH}}", batchFile));
    const process = await execFilePromise(executable, realArgs, {
        cwd: outputDirectory
    });
    const outputPath = process.stdout.trim();
    if (!path.isAbsolute(outputPath)) throw new Error(process.stderr);
    return outputPath;
};

const ytdlpErrorForResponse = (error = "") => {
    // NOTE: yt-dlp will repeat the input URL if it's invalid which may be problematic
    const cleanedError = `${error}`.trim().split("\n").at(-1);
    if (cleanedError.toLowerCase().includes("no suitable extractor found for url"))
        return "No suitable extractor found for URL";
    return cleanedError;
};

module.exports = {
    method: "get",
    request: async (req, res) => {
        if (!env.getBool("ALLOW_COMPUTER_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_FILE_TEMP_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_NETWORK_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_OPERATING_SYSTEM_APIS")) return res.status(403).json({ error: "Disabled on this host" });

        // validate input link/id
        const inputPart = String(req.query.v || req.query.link || req.query.id || "").trim();
        if (!inputPart)
            return res.status(400).json({
                error: "No video link",
                example: "/ytdlp?v=dQw4w9WgXcQ"
            });
        if (inputPart.length > 512)
            return res.status(400).json({ error: "Invalid link" });
        if (inputPart.startsWith("#") || inputPart.startsWith(";") || inputPart.startsWith("]"))
            return res.status(400).json({ error: "Invalid link" });

        // create the environment
        const id = uuid.v4();
        const outputDirectory = path.join(__dirname, `../../temp/ytdlp-${id}/`);
        fs.mkdirSync(outputDirectory);
        const removeEnvironment = () => {
            try {
                if (fs.existsSync(outputDirectory))
                    fs.rmSync(outputDirectory, { force: true, recursive: true });
            } catch (err) {
                console.warn("Failed to remove", outputDirectory, err);  
            }
        };

        // probe the url
        let inputInformation = null;
        try {
            inputInformation = await probeOutput(inputPart, outputDirectory);
        } catch (err) {
            // NOTE: if we fail at the probe stage we assume it's the client's fault
            res.status(400);
            res.json({ error: ytdlpErrorForResponse(err) });
            return removeEnvironment();
        }

        // verify info
        if (inputInformation.duration > env.getNumber("YTDLP_MAX_DURATION")) {
            removeEnvironment();
            return res.status(400).json({ error: `duration exceeds ${env.getNumber("YTDLP_MAX_DURATION")}` });
        }
        if (inputInformation.filesize > env.getNumber("YTDLP_MAX_FILESIZE")) {
            removeEnvironment();
            return res.status(400).json({ error: `filesize exceeds ${env.getNumber("YTDLP_MAX_FILESIZE")}` });
        }
        if (inputInformation.age_limit > env.getNumber("YTDLP_MAX_AGE_LIMIT")) {
            removeEnvironment();
            return res.status(400).json({ error: `age_limit exceeds ${env.getNumber("YTDLP_MAX_AGE_LIMIT")}` });
        }

        if (env.getBool("YTDLP_PREVENT_LIVE") && !(inputInformation.live_status === "not_live" || inputInformation.live_status === "post_live")) {
            removeEnvironment();
            return res.status(400).json({ error: `Live media is prohibited` });
        }

        // download the file
        let outputFile = null;
        const outputType = env.get("YTDLP_OUTPUT");
        const outputMime = mime.getType(outputType);
        try {
            outputFile = await makeOutputFile(inputPart, outputDirectory);
        } catch (err) {
            console.error(err);
            res.status(500);
            res.json({ error: ytdlpErrorForResponse(err) });
            return removeEnvironment();
        }

        res.status(200);
        res.setHeader('Content-Type', outputMime);
        res.setHeader('Cache-Control', "public, max-age=86400");
        res.sendFile(outputFile, () => removeEnvironment());
    }
};