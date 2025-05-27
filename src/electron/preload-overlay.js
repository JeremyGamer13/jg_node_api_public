const { ipcRenderer } = require("electron");
const { uIOhook } = require('uiohook-napi');

const xmlEscape = require("../util/xml-escape");
const AppGlobal = require("../util/global");
const HTML = require("../util/html");

// elements
/**
 * @type {HTMLDivElement}
 */
let overlayElements;
window.addEventListener("DOMContentLoaded", () => {
    overlayElements = document.getElementById("overlay-elements");
});

// overlay messages
/**
 * @type {HTMLDivElement}
 */
let overlayMenu;
let overlayMenuOpened = false;
/**
 * @type {HTMLDivElement}
 */
let overlayMessage;
let overlayMessageTimeout;
const overlayMessageHotkeyHint = "Ctrl + Shift + Backtick (`)";
const overlayNotificationShow = (text) => {
    if (overlayMessageTimeout) {
        clearTimeout(overlayMessageTimeout);
        overlayMessageTimeout = null;
    }

    overlayMessage.innerHTML = xmlEscape(text);
    overlayMessage.style.display = "";
    overlayMessageTimeout = setTimeout(() => {
        overlayMessage.style.display = "none";
    }, 3000);
};
const overlayMenuShow = () => {
    overlayMenuOpened = true;
    overlayMenu.style.display = "";
    overlayMenu.innerHTML = "";
};
const overlayMenuHide = () => {
    overlayMenu.style.display = "none";
    overlayMenu.innerHTML = "";
    overlayMenuOpened = false;
};

// inital startup
window.addEventListener("DOMContentLoaded", () => {
    overlayMenu = document.getElementById("overlay-menu");
    overlayMessage = document.getElementById("overlay-message");
    overlayNotificationShow(`Overlay created, Press ${overlayMessageHotkeyHint} to manage`);
});

// handler funcs
const createElementVideo = () => {
    const video = document.createElement("video");
    overlayElements.appendChild(video);
    return video;
};

// handlers
// TODO: coins explosion, casino winning thing? with the money winning sound obv
ipcRenderer.on("play-video-fullscreen", (_, opts) => {
    console.log(opts);
    if (!opts.path) return;

    const video = createElementVideo();
    video.style = "position:absolute;left:0;top:0;width:100%;height:100%;object-fit: fill;";
    video.src = opts.path;
    console.log(video);

    video.onended = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        video.remove();
    };
    video.onerror = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        video.remove();
    };

    video.playbackRate = opts.playbackRate || 1;
    video.volume = opts.volume || 1;
    video.play();
});
// TODO: Make this work, should screenshot with windows module
ipcRenderer.on("play-video-fullscreen-with-screenshot", (_, opts) => {
    console.log(opts);
    if (!opts.path) return;

    const video = createElementVideo();
    video.style = "position:absolute;left:0;top:0;width:100%;height:100%;object-fit: fill;";
    video.src = opts.path;
    console.log(video);

    video.onended = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        video.remove();
    };
    video.onerror = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        video.remove();
    };

    video.playbackRate = opts.playbackRate || 1;
    video.volume = opts.volume || 1;
    video.play();
});

// editing UI
let editingUiMenu;
const editingUiOpen = () => {
    editingUiMenu.style.display = "";
};
const editingUiClose = () => {
    editingUiMenu.style.display = "none";
    overlayMenuHide();
};

window.addEventListener("DOMContentLoaded", () => {
    const editingUiBar = document.getElementById("overlay-management-bar");
    editingUiMenu = document.getElementById("overlay-management");

    // TODO: Menu for window management, with closing the overlay window, making it not always on top, and changing the fullscreen mode (currently windows taskbar is forced to show)
    const overlayButtonOverlay = HTML.createElement("button", editingUiBar, (element) => { element.innerHTML = "Overlays"; });
    overlayButtonOverlay.onclick = () => {
        if (overlayMenuOpened) return overlayMenuHide();
        overlayMenuShow();

        const clearOverlays = HTML.createElement("button", overlayMenu, (element) => { element.innerHTML = "Kill Overlays"; });
        clearOverlays.onclick = () => {
            overlayElements.innerHTML = "";
        };
    };
});

// TODO: Keybind to close the overlay window
uIOhook.start();
uIOhook.on('keydown', async (event) => {
    // Ctrl + Shift + `
    if (event.ctrlKey && event.shiftKey && event.keycode === 41) {
        const isNotEditing = await ipcRenderer.invoke("get-overlay-window-selectable");
        if (isNotEditing) {
            await ipcRenderer.invoke("update-overlay-window-selectable", true);
            editingUiOpen();
            overlayNotificationShow("Editing Overlay");
        } else {
            await ipcRenderer.invoke("update-overlay-window-selectable", false);
            editingUiClose();
            overlayNotificationShow(`Management menu exited, Press ${overlayMessageHotkeyHint} to manage overlay`);
        }
    }
});