const fs = require("fs");
const path = require("path");
const uuid = require("uuid");

const AppGlobal = require("../util/global.js");
const env = require("../util/env-util.js");

const electron = require('../electron/index.js');
const OperatingSystem = require('../util/os.js');
const Scene = require('../util/scene.js');
const safeCss = require('../util/safe-css.js');

const getId = (key, starting) => {
    return key.split(starting).slice(1).join(starting);
};

module.exports = {
    method: "get",
    request: async (req, res) => {
        if (!AppGlobal.isElectron) return res.status(403).json({ error: "Host is not using Electron" });
        if (!env.getBool("ALLOW_COMPUTER_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_AUDIO_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_VIDEO_APIS")) return res.status(403).json({ error: "Disabled on this host" });

        const window = electron.getOverlayWindow();
        if (!window) return res.status(403).json({ error: "Overlay window is not active" });

        const scene = new Scene();

        const assetsPath = path.join(__dirname, "../../assets") + path.sep;
        try {
            for (const key in req.query) {
                const value = req.query[key];

                if (key.startsWith("asset")) {
                    const identifier = getId(key, "asset");
                    const sceneObject = new Scene.SceneObject(identifier, "object");
                    sceneObject.style.pointerEvents = "none";
                    scene.add(sceneObject);

                    switch (value) {
                        case "screenshot":
                            if (!env.getBool("ALLOW_OPERATING_SYSTEM_APIS")) throw new Error("Disabled on this host");
                            const screenshot = await OperatingSystem.screenshot(true);
                            const dataUrl = "data:image/png;base64," + screenshot.toString("base64");
                            sceneObject.type = "image";
                            sceneObject.assetPath = dataUrl;
                            sceneObject.style.position = "absolute";
                            break;
                        case "object":
                        case "text":
                            sceneObject.style.padding = "0";
                            sceneObject.style.margin = "0";
                            sceneObject.style.marginBlock = "0";
                            sceneObject.style.fontFamily = "Verdana";
                        case "image":
                        case "video":
                            sceneObject.style.position = "absolute";
                        case "audio":
                            sceneObject.type = value;
                            // NOTE: these also run for image, object, text but dont have to
                            sceneObject.properties.disablePictureInPicture = true;
                            sceneObject.properties.disableRemotePlayback = true;
                            sceneObject.properties.autoplay = true;
                            sceneObject.properties.controls = false;
                            break;
                        default:
                            throw new Error("Invalid asset type");
                    }
                } else if (key.startsWith("path")) {
                    const identifier = getId(key, "path");
                    const object = scene.get(identifier);
                    if (!object) throw new Error("Asset not created");
                    if (object.type === "object" || object.type === "text") throw new Error("Asset type does not allow path");
                    
                    let finalPath = "";
                    switch (object.type) {
                        case "image":
                            const imagePath = path.join(__dirname, "../../assets/images/" + value);
                            if (!imagePath.startsWith(assetsPath)) throw new Error("Invalid Image Path");
                            if (!fs.existsSync(imagePath)) throw new Error("Image does not exist");
                            finalPath = imagePath;
                            break;
                        case "video":
                            const videoPath = path.join(__dirname, "../../assets/video/" + value);
                            if (!videoPath.startsWith(assetsPath)) throw new Error("Invalid Video Path");
                            if (!fs.existsSync(videoPath)) throw new Error("Video does not exist");
                            finalPath = videoPath;
                            break;
                        case "audio":
                            const audioPath = path.join(__dirname, "../../assets/audio/" + value);
                            if (!audioPath.startsWith(assetsPath)) throw new Error("Invalid Sound Path");
                            if (!fs.existsSync(audioPath)) throw new Error("Sound does not exist");
                            finalPath = audioPath;
                            break;
                    }

                    object.assetPath = finalPath;
                } else if (key.startsWith("cont")) {
                    const identifier = getId(key, "cont");
                    const object = scene.get(identifier);
                    if (!object) throw new Error("Asset not created");
                    if (object.type !== "object" && object.type !== "text") throw new Error("Asset type does not allow content");

                    // This will either be text for `text`, or another object's ID for `object` to contain
                    object.content = value;
                } else if (key.startsWith("prop")) {
                    const identifier = getId(key, "prop");
                    const object = scene.get(identifier);
                    if (!object) throw new Error("Asset not created");

                    const propsObject = JSON.parse(value);
                    const realProperties = {};

                    for (const key in propsObject) {
                        const value = propsObject[key];
                        if (typeof value === "function" || typeof value === "object") continue;
                        switch (key) {
                            case "volume":
                                realProperties.volume = Math.min(Number(value || 1), 1) * env.getNumber("AUDIO_VOLUME");
                                break;
                            case "alt":
                            case "decoding":
                            case "fetchPriority":
                            case "loading":
                            case "width":
                            case "height":
                            case "videoWidth":
                            case "videoHeight":
                            case "x":
                            case "y":
                            case "autoplay":
                            case "currentTime":
                            case "loop":
                            case "muted":
                            case "preservesPitch":
                            case "paused":
                            case "preload":
                            case "playbackRate":
                            
                            // technically or literally custom props
                            case "onloadshow":
                            case "onloadhide":
                            case "onloadpause":
                            case "onloadunpause":
                            case "onloadmute":
                            case "onloadunmute":
                            case "onloaddestroy":
                            case "onloadend":
                            case "onerrorshow":
                            case "onerrorhide":
                            case "onerrorpause":
                            case "onerrorunpause":
                            case "onerrormute":
                            case "onerrorunmute":
                            case "onerrordestroy":
                            case "onerrorend":
                            case "onplayshow":
                            case "onplayhide":
                            case "onplaypause":
                            case "onplayunpause":
                            case "onplaymute":
                            case "onplayunmute":
                            case "onplaydestroy":
                            case "onplayend":
                            case "onendedshow":
                            case "onendedhide":
                            case "onendedpause":
                            case "onendedunpause":
                            case "onendedmute":
                            case "onendedunmute":
                            case "onendeddestroy":
                            case "onendedend":
                                realProperties[key] = value;
                                break;
                        }
                    }

                    object.properties = { ...object.properties, ...realProperties };
                } else if (key.startsWith("style")) {
                    const identifier = getId(key, "style");
                    const object = scene.get(identifier);
                    if (!object) throw new Error("Asset not created");
                    if (object.type === "audio") throw new Error("Asset type does not allow style");

                    const styleObject = JSON.parse(value);
                    const safeStyles = safeCss.filterProperties(styleObject);
                    object.style = { ...object.style, ...safeStyles };
                }
            }
        } catch (err) {
            return res.status(400).json({ error: String(err) });
        }

        const sceneExport = scene.export();
        console.log(JSON.stringify(sceneExport, null, 4));
        window.webContents.send("display-scene", {
            scene: sceneExport,
        });

        res.status(200);
        res.json({ success: true });
    }
};