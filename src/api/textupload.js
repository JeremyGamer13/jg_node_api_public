const fs = require("fs");
const path = require("path");

const AppGlobal = require("../util/global");
const env = require("../util/env-util");

module.exports = {
    method: "post",
    request: async (req, res) => {
        if (!env.getBool("ALLOW_COMPUTER_APIS")) return res.status(403).json({ error: "Disabled on this host" });
        if (!env.getBool("ALLOW_FILE_TEMP_APIS")) return res.status(403).json({ error: "Disabled on this host" });

        const tempPath = path.join(__dirname, `../../temp/uploadedtext.txt`);
        const text = String(req.body.text);
        fs.writeFileSync(tempPath, text, "utf8");

        res.status(200);
        res.json({ success: true });
    }
};