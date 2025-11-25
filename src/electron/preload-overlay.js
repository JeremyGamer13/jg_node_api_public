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
const createElementImage = () => {
    const image = document.createElement("img");
    overlayElements.appendChild(image);
    return image;
};
const createElementAudio = () => {
    const audio = document.createElement("audio");
    audio.style = "display:none;";
    overlayElements.appendChild(audio);
    return audio;
};
const createElementVideo = () => {
    const video = document.createElement("video");
    overlayElements.appendChild(video);
    return video;
};

const slice = (key, starting) => {
    return key.split(starting).slice(1).join(starting);
};
const runSceneEventTriggeredHandler = (behaviorType, element, target, scene) => {
    switch (behaviorType) {
        case "show":
            if (!target) return;
            if (String(target.dataset.hidden) !== "true" && target.style.display !== "none") return;
            target.dataset.hidden = false;
            if (target.dataset.orgDisplay) {
                target.style.display = target.dataset.orgDisplay;
            } else {
                target.style.display = "";
            }
            return;
        case "hide":
            if (!target) return;
            target.dataset.hidden = true;
            target.dataset.orgDisplay = target.style.display;
            target.style.display = "none";
            return;
        case "pause":
            if (!target) return;
            target.pause();
            return;
        case "unpause":
            if (!target) return;
            target.play();
            return;
        case "mute":
            if (!target) return;
            target.muted = true;
            return;
        case "unmute":
            if (!target) return;
            target.muted = false;
            return;
        case "destroy":
            if (!target) return;
            target.remove();
            return;
        case "end":
            scene.remove();
            return;
    }
};
const createSceneEventHandler = (eventType, element, target, scene) => {
    if (eventType.startsWith("onload")) {
        const type = slice(eventType, "onload");
        element.onload = () => runSceneEventTriggeredHandler(type, element, target, scene);
    } else if (eventType.startsWith("onerror")) {
        const type = slice(eventType, "onerror");
        element.onerror = () => runSceneEventTriggeredHandler(type, element, target, scene);
    } else if (eventType.startsWith("onplay")) {
        const type = slice(eventType, "onplay");
        element.onplay = () => runSceneEventTriggeredHandler(type, element, target, scene);
    } else if (eventType.startsWith("onended")) {
        const type = slice(eventType, "onended");
        element.onended = () => runSceneEventTriggeredHandler(type, element, target, scene);
    }
};

// handlers
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
ipcRenderer.on("play-video-fullscreen-with-image", (_, opts) => {
    console.log(opts);
    if (!opts.path) return;

    const div = document.createElement("div");
    div.style = "position:absolute;left:0;top:0;width:100%;height:100%;";
    overlayElements.appendChild(div);
    console.log(div);

    const image = document.createElement("img");
    image.style = `position:absolute;`;
    image.style.left = `${opts.imageX}%`;
    image.style.top = `${opts.imageY}%`;
    image.style.width = `${opts.imageWidth}%`;
    image.style.height = `${opts.imageHeight}%`;
    image.src = opts.imageUrl;
    div.appendChild(image);
    console.log(image);

    const video = document.createElement("video");
    video.style = "position:absolute;left:0;top:0;width:100%;height:100%;object-fit: fill;";
    video.src = opts.path;
    div.appendChild(video);
    console.log(video);

    video.onended = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        div.remove();
    };
    video.onerror = () => {
        if (opts.temp === true) ipcRenderer.invoke("delete-file-temp", { path: opts.path });
        div.remove();
    };

    video.playbackRate = opts.playbackRate || 1;
    video.volume = opts.volume || 1;
    video.play();
});
ipcRenderer.on("display-scene", (_, opts) => {
    console.log(opts);
    const scene = opts.scene;
    if (!scene) return;

    // scene container
    const sceneContainer = document.createElement("div");
    sceneContainer.style = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;";
    overlayElements.appendChild(sceneContainer);

    // render objects
    const runAfterInit = [];
    const objectIdPrefix = `sceneOverlayObject${Date.now()}${Math.random()}`;
    for (const id in scene.contents) {
        const object = scene.contents[id];

        // create the element, and do some
        // type specific stuff first
        /** @type {HTMLElement} */
        let htmlElement = null;
        switch (object.type) {
            case "object":
                const div = document.createElement("div");
                div.id = `${objectIdPrefix}${id}`;
                sceneContainer.appendChild(div);
                htmlElement = div;

                if (object.content) {
                    runAfterInit.push(() => {
                        const element = document.getElementById(objectIdPrefix + object.content);
                        if (!element) return;
                        div.appendChild(element);
                    });
                }
                break;
            case "text":
                const span = document.createElement("span");
                span.id = `${objectIdPrefix}${id}`;
                sceneContainer.appendChild(span);
                htmlElement = span;

                span.innerText = `${object.content}`;
                break;
            case "image":
                const image = createElementImage();
                image.id = `${objectIdPrefix}${id}`;
                sceneContainer.appendChild(image);
                htmlElement = image;

                image.src = object.assetPath;
                break;
            case "video":
                const video = createElementVideo();
                video.id = `${objectIdPrefix}${id}`;
                sceneContainer.appendChild(video);
                htmlElement = video;

                video.src = object.assetPath;
                break;
            case "audio":
                const audio = createElementAudio();
                audio.id = `${objectIdPrefix}${id}`;
                sceneContainer.appendChild(audio);
                htmlElement = audio;

                audio.src = object.assetPath;
                break;
        }

        // apply styles
        for (const styleProp in object.style) {
            const styleVal = object.style[styleProp];
            htmlElement.style[styleProp] = styleVal;
        }
        // apply properties
        for (const propertyName in object.properties) {
            const value = object.properties[propertyName];

            switch (propertyName) {
                case "onloadshow":
                case "onloadhide":
                case "onloadpause":
                case "onloadunpause":
                case "onloadmute":
                case "onloadunmute":
                case "onloaddestroy":
                case "onloadend":
                case "onerrorshow":
                case "onerrorhide":
                case "onerrorpause":
                case "onerrorunpause":
                case "onerrormute":
                case "onerrorunmute":
                case "onerrordestroy":
                case "onerrorend":
                case "onplayshow":
                case "onplayhide":
                case "onplaypause":
                case "onplayunpause":
                case "onplaymute":
                case "onplayunmute":
                case "onplaydestroy":
                case "onplayend":
                case "onendedshow":
                case "onendedhide":
                case "onendedpause":
                case "onendedunpause":
                case "onendedmute":
                case "onendedunmute":
                case "onendeddestroy":
                case "onendedend":
                    const target = document.getElementById(objectIdPrefix + value);
                    createSceneEventHandler(propertyName, htmlElement, target, sceneContainer);
                    continue;
            }

            htmlElement[propertyName] = value;
        }
    }
    for (const func of runAfterInit) {
        func();
    }
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