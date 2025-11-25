class SceneObject {
    /**
     * @param {string} id 
     * @param {"object"|"text"|"image"|"video"|"audio"} type 
     * @param {string?} assetPath 
     */
    constructor(id, type, assetPath) {
        this.id = id;
        this.type = type;
        this.assetPath = assetPath || "";

        /** @type {CSSStyleDeclaration} */
        this.style = {};
        /** @type {string} */
        this.content = "";
        /** @type {object} */
        this.properties = {};

        /** @type {Scene} @protected */
        this._scene = null;
    }

    /**
     * Deletes this object.
     */
    remove() {
        if (this._scene) {
            this._scene.remove(this.id);
        }
    }

    /**
     * Exports this object to be used by the overlay window.
     * @returns {object}
     */
    export() {
        return {
            type: this.type,
            assetPath: this.assetPath,
            style: this.style,
            content: this.content,
            properties: this.properties,
        };
    }
}

class Scene {
    static SceneObject = SceneObject;

    constructor() {
        /** @protected */
        this._contents = {};

        this.properties = {};
    }

    /**
     * Adds a SceneObject to the Scene.
     * @param {SceneObject} object The object to add to the scene.
     */
    add(object) {
        if (object._scene) throw new Error("Object already has scene");
        this._contents[object.id] = object;
        object._scene = this;
    }
    /**
     * Removes a SceneObject from the scene.
     * @param {string} id The object to remove from the scene.
     */
    remove(id) {
        /** @type {SceneObject} */
        const object = this._contents[id];
        object._scene = null;
        delete this._contents[id];
    }

    /**
     * Gets a SceneObject in the scene by ID.
     * @param {string} id ID of the SceneObject you want to get.
     * @returns {SceneObject}
     */
    get(id) {
        return this._contents[id];
    }

    /**
     * Exports the scene to be used by the overlay window.
     * @returns {object}
     */
    export() {
        const contents = {};
        for (const id in this._contents) {
            /** @type {SceneObject} */
            const object = this._contents[id];
            contents[id] = object.export();
        }
        return {
            contents: contents,
            properties: structuredClone(this.properties),
        };
    }
}

module.exports = Scene;