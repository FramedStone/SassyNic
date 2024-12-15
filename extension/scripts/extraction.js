console.log("content script successfully injected");

// Listen messages from 'background.js'
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "extractTrimester") {
        console.log("Current Course Index: ", message.courseIndex);
        console.log("Trimester Title: ", message.trimesterTitle);

        waitForElement({
            selector: `PLANNER_ITEMS_NFF$0_row_${message.courseIndex}`,
            method: 'getElementById',
            attributes: {
                "data-role": "button",
                onclick: true
            },
        }).then((element) => {
            element.click();
            chrome.runtime.sendMessage({ action: "viewClasses_", courseIndex: message.courseIndex, courseTotal: message.courseTotal, dataset: message.dataset ? message.dataset : null });
        }).catch((error) => {
            if(message.nextClass === true) {
                message.courseIndex--;
                chrome.runtime.sendMessage({ action: "nextClassExtraction", courseIndex: message.courseIndex, courseTotal: message.courseTotal, dataset: message.dataset ? message.dataset : null }); 
            } else {
                console.error(error);
            }
        });
    }

    if(message.action === "viewClasses") {
        waitForElement({
            selector: 'div.ps_box-button span.ps-button-wrapper a.ps-button',
            method: 'querySelectorAll', 
            attributes: {
                "role": "button",
                onclick: true
            },
            textContent: 'View Classes'
        }).then((element) => {
            console.log("View Classes button found: ", element);
            chrome.runtime.sendMessage({ action: "clickViewClasses", courseIndex: message.courseIndex, courseTotal: message.courseTotal, dataset: message.dataset ? message.dataset : null });
        }).catch((error) => {
            console.error(error);
        });
    }

    if(message.action === "checkTrimester") {
        waitForElement({
            selector: 'td.ps_grid-cell div.ps_box-group.psc_layout span.ps-link-wrapper a.ps-link',
            method: 'querySelectorAll',
            attributes: {
                onclick:true,
                "tabindex": "-1"
            },
            timeout: 2000
        }).then((element) => {
            if(Array.from(element).length > 1) {
                alert("Select the trimester row that you want to extract.");

                Array.from(element).forEach((trimester) => {
                    trimester.onclick = function() {
                        console.log("Trimester selected: ", trimester.textContent);
                        chrome.runtime.sendMessage({ action: "trimesterSelected_", courseIndex: message.courseIndex, courseTotal: message.courseTotal, dataset: message.dataset ? message.dataset : null });
                    };
                });
            } else {
                element[0].click();
                chrome.runtime.sendMessage({ action: "trimesterSelected_", courseIndex: message.courseIndex, courseTotal: message.courseTotal, dataset: message.dataset ? message.dataset : null });
            }

        }).catch((error) => {
            console.error(error);
            console.log("Trimester element not found.");
            console.log("Attempt to proceed to the next step......")

            // Proceed to the next step
            chrome.runtime.sendMessage({ action: "trimesterSelected_", courseIndex: message.courseIndex, courseTotal: message.courseTotal, dataset: message.dataset ? message.dataset : null, trimesterElement: false });
        });
    }

    if(message.action === "extractClassDetails") {
        waitForElement({
            selector: 'SSR_CRSE_INFO_V_COURSE_TITLE_LONG',
            method: 'getElementById',
        }).then(() => {
            let dataset;

            if(message.dataset === null || message.dataset === undefined) {
                console.log("Dataset is empty.");
                dataset = [];
            } else {
                dataset = message.dataset;
            }
            // extract class details
            // Subject Title + Code -> Option -> Misc
            const title = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').textContent;
            const code = document.getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG').textContent;
            dataset.push({
                title: title, code: code,
                misc: []
            }); 

            // Misc
            const option = document.querySelectorAll('td.OPTION_NSFF');
            const class_ = document.querySelectorAll('td.CMPNT_CLASS_NBR a');
            const daytime = document.querySelectorAll('td.DAYS_TIMES div div');
            const room = document.querySelectorAll('td.ROOM div div');
            const instructor = document.querySelectorAll('td.INSTRUCTOR div.ps_box-longedit');
            const seats = document.querySelectorAll('td.SEATS div.ps_box-longedit');

            Array.from(option).forEach((option_, index) => {
                const status = document.getElementById(`SSR_DER_CS_GRP_SSR_OPTION_STAT$${index}`);

                dataset[message.courseIndex].misc.push({
                    option: option_.textContent.trim(),
                    status: status.textContent.trim(),
                    class: [],
                })

                daytime.forEach((daytime_, index_) => {
                    const el = daytime_.querySelectorAll('span');
                    let tempDay = [], tempTime = []; 
                    let tempRoom = [], tempInstructor = [], tempSeats = [];

                    el.forEach((el_) => {
                        let [tempDay_, tempTime_] = el_.innerHTML.includes('\n') 
                            ? el_.innerHTML.split('\n') 
                            : el_.innerText.split('\n');
                        tempDay.push(tempDay_);
                        tempTime.push(tempTime_.replace('<br>',''));
                    });

                    const elRoom = room[index_].querySelectorAll('span');
                    elRoom.forEach((el_) => {
                        tempRoom.push(el_.textContent.trim());
                    });

                    dataset[message.courseIndex].misc[index].class.push({
                        class: class_[index_].textContent.trim(),
                        day: tempDay,
                        time: tempTime,
                        room: tempRoom,
                    });
                });
            
            });                  

            chrome.runtime.sendMessage({ action: "nextClassExtraction", courseIndex: message.courseIndex, courseTotal: message.courseTotal, dataset: dataset });
        }).catch((error) => {
            console.error(error);
        });

    }

    if(message.action === "extractionCompleted") {
        console.log("Received message: ", message.message);
        alert(message.message);
    }
});

/**
 * Waits for an element to appear in the DOM using specified selection methods and attribute conditions,
 * optionally filtering by textContent or value, and ensuring the element is interactable before resolving.
 * @param {string} selector - The CSS selector or ID for the target element(s).
 * @param {string} method - The selection method: 'querySelector', 'querySelectorAll', 'getElementById'.
 * @param {Object} [observerConfig={ attributes: true, childList: true, subtree: true }] - MutationObserver configuration.
 * @param {number} [timeout=5000] - Maximum time to wait in milliseconds.
 * @param {Object|Array} [attributes=null] - Attribute conditions to check.
 * @param {string} [textContent=null] - Specific textContent to match.
 * @param {string} [value=null] - Specific value to match.
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
                        resolve(elements);
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
