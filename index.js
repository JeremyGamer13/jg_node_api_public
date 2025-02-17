const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8080;

// TODO: Automatically load endpoints.
const endpointTTS = require("./src/api/tts");

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
    res.send("ermm.. what the sigma...");
});

app.get('/tts', endpointTTS);

app.listen(port, () => console.log('Started server on port ' + port));