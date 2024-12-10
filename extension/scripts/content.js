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

            let index = message.courseTotal - 1;

            (async () => {
                do {
                    console.log("Index:", index);
                    // Courses
                    await waitForElement({
                        selector: `PLANNER_ITEMS_NFF$0_row_${index}`, 
                        method: 'getElementById', 
                        attributes: {
                            onclick: true, 
                            'data-role': 'button'
                        }
                    }).then((element) => {
                        element.click();
                    }).catch((error) => {
                        console.error(error);
                    });

                    // View Classes
                    await waitForElement({
                        selector: 'div.ps_box-button span.ps-button-wrapper a.ps-button',
                        method: 'querySelectorAll',
                        attributes: {
                            'role': 'button',
                            onclick: true
                        },
                        textContent: 'View Classes'
                    }).then((element) => {
                        console.log(element);
                    }).catch((error) => {
                        console.error(error);
                    });
                } while(index-- !== 0);
            })();
        }
    }
});

/**
 * Waits for an element to appear in the DOM using specified selection methods and attribute conditions,
 * optionally filtering by textContent or value, and ensuring the element is interactable before resolving.
 * @param {Object} options - Configuration options.
 * @param {string} options.selector - The CSS selector or ID for the target element(s).
 * @param {string} [options.method='querySelector'] - The selection method: 'querySelector', 'querySelectorAll', 'getElementById'.
 * @param {Object} [options.observerConfig={ attributes: true, childList: true, subtree: true }] - MutationObserver configuration.
 * @param {number} [options.timeout=5000] - Maximum time to wait in milliseconds.
 * @param {Object|Array} [options.attributes=null] - Attribute conditions to check.
 * @param {string} [options.textContent=null] - Specific textContent to match.
 * @param {string} [options.value=null] - Specific value to match.
 * @returns {Promise<Element>} - Resolves with the found element that meets all conditions.
 */
function waitForElement({
    selector,
    method = 'querySelector',
    observerConfig = { attributes: true, childList: true, subtree: true },
    timeout = 5000,
    attributes = null,
    textContent = null,
    value = null
}) {
    return new Promise((resolve, reject) => {
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
                const id = selector.startsWith('#') ? selector.slice(1) : selector;
                selectFunction = () => document.getElementById(id);
                break;
            default:
                reject(new Error(`Unsupported selection method: "${method}". Use 'querySelector', 'querySelectorAll', or 'getElementById'.`));
                return;
        }

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

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const topElement = document.elementFromPoint(centerX, centerY);
            const isNotObstructed = topElement === element || element.contains(topElement);

            return isNotObstructed;
        }

        function checkAttributes(element) {
            if (!attributes) return true;

            if (typeof attributes === 'object' && !Array.isArray(attributes)) {
                for (let [attr, condition] of Object.entries(attributes)) {
                    if (typeof condition === 'function') {
                        const attrValue = element.getAttribute(attr);
                        if (!condition(attrValue)) {
                            return false;
                        }
                    } else if (condition === true) {
                        if (!element.hasAttribute(attr)) {
                            return false;
                        }
                    } else {
                        if (element.getAttribute(attr) !== condition) {
                            return false;
                        }
                    }
                }
                return true;
            } else if (Array.isArray(attributes)) {
                return attributes.every(attr => element.hasAttribute(attr));
            }

            return true;
        }

        function matchesFilter(element) {
            if (textContent && element.textContent.trim() !== textContent) {
                return false;
            }
            if (value && element.value !== value) {
                return false;
            }
            return true;
        }

        const initialElements = selectFunction();
        if (initialElements) {
            if (method === 'querySelectorAll') {
                const foundElement = Array.from(initialElements).find(el => checkAttributes(el) && isElementInteractable(el) && matchesFilter(el));
                if (foundElement) {
                    resolve(foundElement);
                    return;
                }
            } else {
                if (checkAttributes(initialElements) && isElementInteractable(initialElements) && matchesFilter(initialElements)) {
                    resolve(initialElements);
                    return;
                }
            }
        }

        const observer = new MutationObserver((mutations, obs) => {
            const elements = selectFunction();
            if (elements) {
                if (method === 'querySelectorAll') {
                    const foundElement = Array.from(elements).find(el => checkAttributes(el) && isElementInteractable(el) && matchesFilter(el));
                    if (foundElement) {
                        resolve(foundElement);
                        obs.disconnect();
                    }
                } else {
                    if (checkAttributes(elements) && isElementInteractable(elements) && matchesFilter(elements)) {
                        resolve(elements);
                        obs.disconnect();
                    }
                }
            }
        });

        observer.observe(document.body, observerConfig);

        const timer = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element with selector "${selector}" using method "${method}" and specified conditions not found within ${timeout}ms.`));
        }, timeout);

        const cleanup = () => clearTimeout(timer);
        const originalResolve = resolve;
        const originalReject = reject;
        resolve = (value) => { cleanup(); originalResolve(value); };
        reject = (reason) => { cleanup(); originalReject(reason); };
    });
}
