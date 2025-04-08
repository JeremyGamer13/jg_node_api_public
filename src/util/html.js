class HTML {
    /**
     * @param {keyof HTMLElementTagNameMap} tagName 
     * @param {HTMLElement} parent 
     * @param {(element:HTMLElement, parent:HTMLElement?) => void} callback 
     * @returns {HTMLElement}
     */
    static createElement(tagName, parent, callback) {
        const element = document.createElement(tagName);
        if (parent) {
            parent.appendChild(element);
        }
        if (callback) {
            callback(element, parent);
        }
        return element;
    }
}

module.exports = HTML;