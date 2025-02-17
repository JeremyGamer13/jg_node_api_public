

const { ipcRenderer } = require("electron");
const AppGlobal = require("../util/global");

window.addEventListener("DOMContentLoaded", () => {
    const stateArea = document.getElementById("app-state");
    if (stateArea) setInterval(() => {
        stateArea.value = JSON.stringify(AppGlobal.state, null, 4);
    }, 1000);
});

const createElementAudio = () => {
    const audio = document.createElement("audio");
    audio.style = "display:none;";
    document.body.appendChild(audio);
    return audio;
};

// handlers
ipcRenderer.on("play-audio-normal", (_, opts) => {
    if (!opts.path) return;
    if ((opts.volume || 1) <= 0) return;

    const audio = createElementAudio();
    audio.src = opts.path;
    audio.playbackRate = opts.playbackRate || 1;
    audio.volume = opts.volume || 1;
    
    if (opts.temp === true) {
        audio.onended = () => {
            ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        };
        audio.onerror = () => {
            ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        };
        audio.onsuspend = () => {
            ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        };
    }

    audio.play();
});