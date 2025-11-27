const { contextBridge, ipcRenderer } = require("electron");
const AppGlobal = require("../util/global");
const jgNodeUtils = require("jg-node-utils");

contextBridge.exposeInMainWorld("jgNodeUtils", {
    audioPresets: jgNodeUtils.audioPresets,
    overlayPresets: jgNodeUtils.overlayPresets,
    objectToSearchParams: jgNodeUtils.objectToSearchParams,
});
contextBridge.exposeInMainWorld("fetchSelf", (postHref, options = {}) => {
    return ipcRenderer.invoke("request-self", {
        postHref,
        body: options.body,
        headers: options.headers,
        method: options.method,
    });
});

// elements
/**
 * @type {HTMLDivElement}
 */
let runtimeElements;
window.addEventListener("DOMContentLoaded", () => {
    runtimeElements = document.getElementById("app-runtime-elements");
});

// inital startup & basic menu
window.addEventListener("DOMContentLoaded", () => {
    const stateArea = document.getElementById("app-state");
    if (stateArea) setInterval(() => {
        stateArea.value = JSON.stringify(AppGlobal.state, null, 4);
    }, 1000);

    const overlayCreator = document.getElementById("app-overlay-create");
    const overlayKiller = document.getElementById("app-overlay-kill");
    if (overlayCreator && overlayKiller) {
        overlayCreator.onclick = () => {
            ipcRenderer.invoke("create-overlay-window");
        };
        overlayKiller.onclick = () => {
            ipcRenderer.invoke("kill-overlay-window");
        };
    }

    const clearRuntimeElements = document.getElementById("app-clear-runtime-elements");
    const clearRuntimeElementsAudioTab = document.getElementById("app-clear-runtime-elements-audio");
    if (clearRuntimeElements && clearRuntimeElementsAudioTab) {
        clearRuntimeElements.onclick = () => {
            runtimeElements.innerHTML = "";
        };
        clearRuntimeElementsAudioTab.onclick = () => {
            runtimeElements.innerHTML = "";
        };
    }
});

// handler funcs
const createElementAudio = () => {
    const audio = document.createElement("audio");
    audio.style = "display:none;";
    runtimeElements.appendChild(audio);
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

    audio.onended = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        audio.remove();
    };
    audio.onerror = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        audio.remove();
    };

    audio.play();
});
