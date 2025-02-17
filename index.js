const fs = require("fs");
const path = require("path");

const AppGlobal = require("./src/util/global");
const env = require("./src/util/env-util");

const bodyParser = require('body-parser');
const express = require('express')
const cors = require('cors');

const app = express();
const port = env.getNumber("PORT");

// create temporary directories
if (!fs.existsSync(path.join(__dirname, "temp/"))) fs.mkdirSync(path.join(__dirname, "temp/"));
if (!fs.existsSync(path.join(__dirname, "cache/"))) fs.mkdirSync(path.join(__dirname, "cache/"));

app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(bodyParser.urlencoded({
    limit: "10kb",
    extended: false
}));
app.use(bodyParser.json({ limit: "10kb" }));

app.get('/', async function (_, res) {
    const state = AppGlobal.state;
    res.json(state);
});

// endpoints
// NOTE: All endpoints and index.js will be ran within electron sometimes. Keep this in mind.
const endpointTTS = require("./src/api/tts");
const endpointAudio = require("./src/api/audio");

app.get('/api/tts', endpointTTS);
app.get('/api/audio', endpointAudio);

app.listen(port, () => console.log('Started server on port ' + port));

if (AppGlobal.isElectron) {
    const electron = require("./src/electron");
    electron.initialize();
}