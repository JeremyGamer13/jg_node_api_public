const fs = require("fs");
const path = require("path");

const AppGlobal = require("../util/global");
const env = require("../util/env-util");

module.exports = {
    method: "get",
    request: async (req, res) => {
        if (!env.getBool("ALLOW_COMPUTER_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_FILE_TEMP_APIS")) return res.status(403).json({ error: "Disabled on this host" });

        const tempPath = path.join(__dirname, `../../temp/uploadedtext.txt`);

        let text = "";
        if (fs.existsSync(tempPath)) {
            text = fs.readFileSync(tempPath, "utf8");
        }

        res.status(200);
        res.send(text);
    }
};