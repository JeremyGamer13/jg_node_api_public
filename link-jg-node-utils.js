const fs = require("fs");
const path = require("path");





// CONFIG
const jgNodeUtilsPath = "C:\\Users\\Jeremy\\Documents\\GitHub\\jg_node_utils";




// script
const nodeModulesPath = path.join(__dirname, "node_modules/jg-node-utils");
if (fs.existsSync(jgNodeUtilsPath) && fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    fs.symlinkSync(jgNodeUtilsPath, nodeModulesPath);
    console.log("symlinked gng");
} else {
    console.log("paths are wrong gng", jgNodeUtilsPath, nodeModulesPath);
}