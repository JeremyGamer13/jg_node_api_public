const path = require("path");

require('dotenv').config({
    path: path.join(__dirname, "../../.env")
});

const getBool = (env) => {
    const value = process.env[env];
    return String(value) === 'true';
};
const getNumber = (env) => {
    const value = process.env[env];
    return Number(value);
};
const get = (env) => {
    const value = process.env[env];
    return String(value);
};

module.exports = {
    getBool,
    getNumber,
    get,
};