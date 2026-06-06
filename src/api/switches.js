const fs = require("fs");
const path = require("path");

const env = require("../util/env-util");
const Switches = require("../util/switches");

module.exports = {
    url: "/api/switches",
    /** @param {import("express").Express} app */
    register: (app, url) => {
        app.options(url, (_, res) => {
            return res.status(200).json({});
        });
        app.get(url, (req, res) => {
            return res.status(200).json(Switches.values);
        });
        app.post(url, (req, res) => {
            const incomingSwitches = (req.body.switches || {});
            if (typeof incomingSwitches !== "object") return res.status(400).json({ error: "Invalid switches" });

            for (const key in incomingSwitches) {
                if (typeof Switches.values[key] !== "boolean" || key.match(/[^a-z0-9]/i))
                    return res.status(400).json({ error: `Invalid switch: ${key}` });
            }

            Object.assign(Switches.values, incomingSwitches);
            return res.status(200).json({ "success": true });
        });
    }
};