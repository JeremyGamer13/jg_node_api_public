const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

const AppGlobal = require("./src/util/global");
const env = require("./src/util/env-util");

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authBearerParser = require('auth-bearer-parser').default;

const app = express();
const port = env.getNumber("PORT");

// create temporary directories
if (!fs.existsSync(path.join(__dirname, "temp/"))) fs.mkdirSync(path.join(__dirname, "temp/"));
if (!fs.existsSync(path.join(__dirname, "cache/"))) fs.mkdirSync(path.join(__dirname, "cache/"));

app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(authBearerParser());
app.use(bodyParser.urlencoded({
    limit: env.get("BODY_LIMIT"),
    extended: false
}));
app.use(bodyParser.json({ limit: env.get("BODY_LIMIT") }));

const apiToken = env.get("TOKEN");
if (!apiToken) console.warn("WARNING: No TOKEN is set in .env, jg_node_api is running open to the public");
app.use((req, res, next) => {
    if (apiToken && req.path.toLowerCase().startsWith("/api/") && req.token !== apiToken)
        return res.status(403).json({ error: "Unauthorized" });
    next(); // Passes control to the next middleware/route
});

app.get('/', async function (_, res) {
    const state = AppGlobal.state;
    res.json(state);
});

// user pages
app.get('/textupload', (_, res) => res.sendFile(path.join(__dirname, "./src/pages/textupload.html")));

// user pages assets
app.get('/all.css', (_, res) => res.sendFile(path.join(__dirname, "./src/pages/all.css")));

// cdn
const shouldHostCDN = env.getBool("HOST_CDN");
const cdnFolderPath = path.join(__dirname, "./assets/cdn");
if (shouldHostCDN && fs.existsSync(cdnFolderPath)) {
    const deviceName = env.get("DEVICE_NAME");
    const cdnPriority = env.getNumber("HOST_CDN_PRIORITY");
    const cdnType = env.get("HOST_CDN_TYPE");
    const cdnAlts = env.get("HOST_CDN_ALTERNATIVES").split(",");
    const cdnMaxAge = env.get("HOST_CDN_MAX_AGE");
    app.get('/cdn-stats', (_, res) => {
        res.json({
            available: true,
            device: deviceName,
            priority: cdnPriority,
            type: cdnType,
            alternatives: cdnAlts,
            maxAge: cdnMaxAge,
        });
    });
    app.use('/cdn', express.static(cdnFolderPath, {
        maxAge: cdnMaxAge,
        index: false,
        fallthrough: false,
    }));
}

// endpoints
// NOTE: All endpoints and index.js will be ran within electron sometimes. Keep this in mind.
glob('./src/api/**').then((paths) => { // ["/api/audio.js"]
    // make sure these paths are usable
    const apiPaths = paths
        .map(path => ("/" + path.replace(/\\/gmi, "/")).replace("/src", "")) // makes these into valid URLs
        .filter(path => path.endsWith('.js')) // removes folders that only have other folders inside
        // index.js marks that the folder name should be the endpoint,
        // otherwise the file name is the endpoint
        .map(path => path.endsWith('index.js') ? path.replace('/index.js', '') : path.replace('.js', ''))
        .map(path => path.endsWith(".hidden") ? path.replace(".hidden", "") : path);

    const filePaths = paths
        .filter(path => path.endsWith('.js')) // removes folders that only have other folders inside
        .map(path => "./" + path.replace(/\\/gmi, "/")); // makes them just typed the same way you would type them in a require function

    // create the endpoints on the app
    for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        const apiPath = apiPaths[i];
        const module = require(filePath);
        if (module.register) {
            // the module registers everything on it's own
            const finalUrl = module.url || apiPath;
            module.register(app, finalUrl);
            console.log('[?]', finalUrl, 'has registered content manually');
        } else {
            if (module.method && module.request) {
                if (!app[module.method]) {
                    console.warn('[!]', apiPath, 'has an invalid method');
                    continue;
                }
                const finalUrl = module.url || apiPath;
                app[module.method](finalUrl, module.request);
                console.log('[-]', finalUrl, 'is registered');
            } else {
                console.warn('[!]', apiPath, 'is missing a method and or endpoint');
            }
        }
    }
});

app.listen(port, () => console.log('Started server on port ' + port));

if (AppGlobal.isElectron) {
    const electron = require("./src/electron");
    electron.initialize();
}