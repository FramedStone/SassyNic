console.log("extraction.js successfully injected");

// Listen messages from 'background.js'
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "startExtraction_") {
        waitForElement({
            selector: "table tbody tr",
            method: "querySelectorAll",
        }).then(() => {
            let term = document.querySelector('span.ps-text[id="PANEL_TITLElbl"]').textContent.trim();
            let subjectTotal = document.querySelectorAll('table[title="Non-Small Form Factor"] tbody tr').length;

            if(message.index < subjectTotal) {
                console.log("Term: ", term);
                console.log("Subjects Total: ", subjectTotal);

                document.getElementById(`PLANNER_ITEMS_NFF$0_row_${message.index}`).click();
                chrome.runtime.sendMessage({ action: "selectedCourse", term: term, index: message.index, tabId: message.tabId, dataset: message.dataset });
            } else {
                alert("Extraction Completed!");
                chrome.runtime.sendMessage({ action: "extractionCompleted" });
            }
        });
    }

    if(message.action === "viewClasses_") {
        waitForElement({
            selector: "div.ps_box-button.psc_primary span a",
            method: "querySelector",
            attributes: {
                onclick:true
            }
        }).then(() => {
            chrome.runtime.sendMessage({ action: "viewClasses", term: message.term, index: message.index, tabId: message.tabId, dataset: message.dataset });
        })
    }


    if (message.action === "selectTerm_") {
        // Create the first waitForElement promise
        const firstPromise = waitForElement({
            selector: "td.ps_grid-cell div.ps_box-group.psc_layout span.ps-link-wrapper a.ps-link",
            method: "querySelectorAll",
            textContent: message.term,
            attributes: {
                onclick: true
            }
        }).then(() => {
            // Action to take if the first promise resolves
            chrome.runtime.sendMessage({ action: "selectTerm", term: message.term, index: message.index, tabId: message.tabId, dataset: message.dataset });
        });

        // Create the second waitForElement promise
        const secondPromise = waitForElement({
            selector: "table tbody tr td",
            method: "querySelectorAll"
        }).then(() => { 
            const dataset = extractClassDetails();
            console.log(dataset)

            const subjectTitle = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').textContent.trim();
            const subjectCode = document.getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG').textContent.trim();
            chrome.runtime.sendMessage({ action: "extractClassDetails", term: message.term, index: message.index, tabId: message.tabId, dataset: dataset, title: subjectTitle, code: subjectCode });
        })

        // Use Promise.race to trigger whichever promise resolves first
        Promise.race([firstPromise, secondPromise])
    }

    if(message.action == "extractClassDetails_") {
        waitForElement({
            selector: "table tbody tr td",
            method: "querySelectorAll"
        }).then(() => { 
            const dataset = extractClassDetails();
            console.log(dataset)

            const subjectTitle = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').textContent.trim();
            const subjectCode = document.getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG').textContent.trim();
            chrome.runtime.sendMessage({ action: "extractClassDetails", term: message.term, index: message.index, tabId: message.tabId, dataset: dataset, title: subjectTitle, code: subjectCode });
        })
    }
});

/**
 * Function that extract class details and process extracted data
 */
function extractClassDetails() {
    const rows = document.querySelectorAll('.ps_grid-row'); // select all rows in the table
    const subjectTitle = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').textContent.trim();
    const subjectCode = document.getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG').textContent.trim();
    const dataset = { title: subjectTitle, code: subjectCode, class: [] };

    // tr
    rows.forEach(row => {
        const class_ = {};
        const option = row.querySelector('.OPTION_NSFF a').textContent.trim();
        const status = row.querySelector('.ps_box-value').textContent.trim();

        const classElements = row.querySelectorAll('.CMPNT_CLASS_NBR a.ps-link');
        const seatsElements = row.querySelectorAll('.SEATS span.ps_box-value');
        const dayTimeElements = row.querySelectorAll('.DAYS_TIMES .ps_box-longedit');
        const roomElements = row.querySelectorAll('.ROOM .ps_box-edit');
        const instructorElements = row.querySelectorAll('.INSTRUCTOR .ps_box-longedit');

        // class
        const classes = Array.from(classElements).map((el, index) => {
            const classText = el.textContent.trim();
            const seats = (seatsElements[index].innerText.trim()).split(' ').filter(char => !isNaN(parseInt(char))).join(' ');
            const misc = [];

            // Bundle misc details (day, time, instructor, room)
            if (dayTimeElements[index]) {
                const daytimeSpans = dayTimeElements[index].querySelectorAll('span');
                const roomSpans = roomElements[index].querySelectorAll('span');
                const instructorSpans = instructorElements[index].querySelectorAll('span');

                daytimeSpans.forEach((span, index_) => {
                    const [day, time] = parseDayAndTime(span.innerHTML.trim());
                    const room = roomSpans[index_].innerText.trim();
                    const instructor = instructorSpans[index_].innerText.trim();
                    misc.push({ day, time, room, instructor });
                });
            }

            return { classText, seats, misc };
        });

        class_.option = option;
        class_.status = status;
        class_.classes = classes;
        
        dataset.class.push(class_);
    });

    return dataset;
}

/**
 * Function to split daytime -> [day, time] and convert time into minutes -> "start end"
 * @param {String} daytime - daytime string 
 * @returns 
 */
function parseDayAndTime(daytime) {
    const parts = daytime.split("<br>");
    const day = parts[0]?.trim();
    const time = parts[1]?.trim();

    // Convert time to "start end" format in minutes
    const timeToMinutes = (timeStr) => {
        const isPM = timeStr.toUpperCase().includes('PM');
        timeStr = timeStr.replace(/[AP]M/i, '').trim();
        
        // Split start and end times
        const [startTime, endTime] = timeStr.split(/\s*to\s*/i);
        
        // Convert individual times to minutes
        const convertSingleTime = (time) => {
            let [hours, minutes] = time.split(':').map(Number);
            
            // Handle 12-hour PM conversion
            if (isPM && hours !== 12) {
                hours += 12;
            }
            // Handle midnight (12 AM)
            if (!isPM && hours === 12) {
                hours = 0;
            }
            
            return hours * 60 + (minutes || 0);
        };
        
        const startMinutes = convertSingleTime(startTime);
        const endMinutes = convertSingleTime(endTime);
        
        return `${startMinutes} ${endMinutes}`;
    };

    return [day, timeToMinutes(time)];
}


/**
 * Waits for an element to appear in the DOM using specified selection methods and attribute conditions,
 * optionally filtering by textContent or value, and ensuring the element is interactable before resolving.
 * @param {string} selector - The CSS selector or ID for the target element(s).
 * @param {string} method - The selection method: 'querySelector', 'querySelectorAll', 'getElementById'.
 * @param {Object} [observerConfig={ attributes: true, childList: true, subtree: true }] - MutationObserver configuration.
 * @param {Object|Array} [attributes=null] - Attribute conditions to check.
 * @param {string} [textContent=null] - Specific textContent to match.
 * @param {string} [value=null] - Specific value to match.
 * @returns {Promise<Element>} - Resolves with the found element that meets all conditions.
 */
function waitForElement({
    selector,
    method = 'querySelector',
    observerConfig = { attributes: true, childList: true, subtree: true },
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
    });
}

