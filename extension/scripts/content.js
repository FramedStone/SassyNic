// TODO: make observer into function to be called only when needed (current implementation will always check for every page reload)
// TODO: wait for the element to be loaded before clicking it

console.log("content script successfully injected");

let trimesterTitle = null;

// MutationObserver setup
/**
 * Observing lists:
 * 1. span.ps-text[id="PANEL_TITLElbl"] - Trimester/Planner Title
 */
const config = { attributes: true, childList: true, subtree: true }; 

const observer = new MutationObserver(() => {
    trimesterTitle = document.querySelector('span.ps-text[id="PANEL_TITLElbl"]');
    if (trimesterTitle) {
        console.log("Trimester/Planner Title found:", trimesterTitle.textContent);
        trimesterTitle = trimesterTitle.textContent;
        observer.disconnect(); // Stop observing once the target is found
    }
});

observer.observe(document.body, config);

// Listen messages from 'background.js'
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === 'extractTrimester') {
        if (document.readyState === "complete") {
            // If the page is already fully loaded
            console.log(message.courseTotal);
            console.log(message.trimesterTitle);

            waitForElements({selector: 'PLANNER_ITEMS_NFF$0_row_0', method: 'getElementById', attributes: {onclick: true, 'data-role': 'button'}}).then((element) => {
                element.click();
            });
        }
    }
});

/**
 * Waits for elements to appear in the DOM using specified selection methods and attribute conditions,
 * ensuring the element is interactable before resolving.
 * @param {Object} options - Configuration options.
 * @param {string} options.selector - The CSS selector or ID for the target element(s).
 * @param {string} [options.method='querySelector'] - The selection method: 'querySelector', 'querySelectorAll', 'getElementById'.
 * @param {Object} [options.observerConfig={ attributes: true, childList: true, subtree: true }] - MutationObserver configuration.
 * @param {number} [options.timeout=5000] - Maximum time to wait in milliseconds.
 * @param {Object|Array} [options.attributes=null] - Attribute conditions to check.
 * @returns {Promise<Element|NodeList<Element>>} - Resolves with the found element(s) that meet attribute conditions and are interactable.
 */
function waitForElements({
    selector,
    method,
    observerConfig = { attributes: true, childList: true, subtree: true },
    timeout = 5000,
    attributes = null
}) {
    return new Promise((resolve, reject) => {
        // Define the selection function based on the method
        let selectFunction;

        switch (method) {
            case 'querySelector':
                selectFunction = () => document.querySelector(selector);
                break;
            case 'querySelectorAll':
                selectFunction = () => {
                    const nodeList = document.querySelectorAll(selector);
                    return nodeList.length > 0 ? nodeList : null;
                };
                break;
            case 'getElementById':
                // Automatically remove '#' if present
                const id = selector.startsWith('#') ? selector.slice(1) : selector;
                selectFunction = () => document.getElementById(id);
                break;
            default:
                reject(new Error(`Unsupported selection method: "${method}". Use 'querySelector', 'querySelectorAll', or 'getElementById'.`));
                return;
        }

        /**
         * Ensures the element is visible and interactable.
         * @param {Element} element - The element to check.
         * @returns {boolean} - True if interactable, else false.
         */
        function isElementInteractable(element) {
            if (!element) return false;

            const style = window.getComputedStyle(element);
            const isVisible = (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0' &&
                element.offsetWidth > 0 &&
                element.offsetHeight > 0
            );

            if (!isVisible) return false;

            // Check if the element is covered by another element
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const topElement = document.elementFromPoint(centerX, centerY);
            const isNotObstructed = topElement === element || element.contains(topElement);

            return isNotObstructed;
        }

        /**
         * Checks if the given element(s) satisfy the attribute conditions.
         * @param {Element|NodeList<Element>} elements - The element or NodeList to check.
         * @returns {boolean} - True if conditions are met, else false.
         */
        function checkAttributes(elements) {
            if (!attributes) return true; // No attribute checks required

            // Handle single element
            if (elements instanceof Element) {
                return verifyAttributes(elements);
            }

            // Handle NodeList
            if (NodeList.prototype.isPrototypeOf(elements)) {
                // Ensure all elements in the NodeList meet the conditions
                return Array.from(elements).every(verifyAttributes);
            }

            return false;
        }

        /**
         * Verifies if a single element meets the attribute conditions.
         * @param {Element} element - The element to verify.
         * @returns {boolean} - True if conditions are met, else false.
         */
        function verifyAttributes(element) {
            if (typeof attributes === 'object' && !Array.isArray(attributes)) {
                // Attributes specified as an object
                for (let [attr, condition] of Object.entries(attributes)) {
                    if (typeof condition === 'function') {
                        // Use the function to verify the attribute value
                        const attrValue = element.getAttribute(attr);
                        if (!condition(attrValue)) {
                            return false;
                        }
                    } else if (condition === true) {
                        // Check for the presence of the attribute
                        if (!element.hasAttribute(attr)) {
                            return false;
                        }
                    } else {
                        // Check if the attribute's value matches the expected value
                        if (element.getAttribute(attr) !== condition) {
                            return false;
                        }
                    }
                }
                return true; // All attribute conditions met
            } else if (Array.isArray(attributes)) {
                // Attributes specified as an array (check for presence)
                return attributes.every(attr => element.hasAttribute(attr));
            }

            // If attributes parameter is neither object nor array
            return true;
        }

        // Attempt to find the element(s) immediately
        const initialElements = selectFunction();
        if (initialElements && checkAttributes(initialElements) && isElementInteractable(initialElements)) {
            resolve(initialElements);
            return;
        }

        // Create a MutationObserver instance
        const observer = new MutationObserver((mutations, obs) => {
            const elements = selectFunction();
            if (elements && checkAttributes(elements) && isElementInteractable(elements)) {
                resolve(elements);
                obs.disconnect();
            }
        });

        // Start observing the document body
        observer.observe(document.body, observerConfig);

        // Set up the timeout
        const timer = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Elements with selector "${selector}" using method "${method}" and specified attributes not found within ${timeout}ms.`));
        }, timeout);

        // Ensure that timeout is cleared when promise is resolved or rejected
        const cleanup = () => clearTimeout(timer);
        // Modify the resolve and reject to include cleanup
        const originalResolve = resolve;
        const originalReject = reject;
        resolve = (value) => { cleanup(); originalResolve(value); };
        reject = (reason) => { cleanup(); originalReject(reason); };
    });
}
