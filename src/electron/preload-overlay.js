const { ipcRenderer } = require("electron");
const AppGlobal = require("../util/global");

/**
 * @type {HTMLDivElement}
 */
let overlayMessage;
let overlayMessageTimeout;
const showOverlayNotification = (text) => {
    if (overlayMessageTimeout) {
        clearTimeout(overlayMessageTimeout);
        overlayMessageTimeout = null;
    }

    // TODO: xmlEscape and use innerHTML
    overlayMessage.innerText = String(text);
    overlayMessage.style.display = "";
    overlayMessageTimeout = setTimeout(() => {
        overlayMessage.style.display = "none";
    }, 3000);
};

window.addEventListener("DOMContentLoaded", () => {
    overlayMessage = document.getElementById("overlay-message");

    // TODO: Make this shortcut work, probably import the same library we used on A-90
    showOverlayNotification("Overlay created, Press Ctrl + Backtick to manage");
});

const createElementVideo = () => {
    const video = document.createElement("video");
    video.style = "width:100%;height:100%;";
    document.body.appendChild(video);
    return video;
};

// handlers
// TODO: Make it so endpoints can play a video on the screen, either filling the screen, using one portion, or moving, etc.
// TODO: probably just make a bunch of green screen effects into transparent webms and make endpoints for them
ipcRenderer.on("play-video-normal", (_, opts) => {
    if (!opts.path) return;
});