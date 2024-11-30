importScripts("./helpers/utils.js");

// Navigate to 'SassyNic' website on installed
// chrome.runtime.onInstalled.addListener(function() {
//     chrome.tabs.create({ url: 'https://sassynic.com' });
// });

let extractionTimeout = 0;

// Select a trimester to extract
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Listen for the 'startExtraction' button click in 'popup.js'
    if (message.action === "startExtraction") {
        setLog(message, sender);

        extractionTimeout = message.timeout;

        // Call the helper function to get the tabId
        getActiveTabId((tabId) => {
            if (tabId !== null) {
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabId },
                        func: getTrimesterClicked,
                    },
                    (result) => {
                        if (result && result[0]) {
                            courseTotal = result[0].result;
                            sendResponse({ message: result[0].result });
                        } else {
                            sendResponse({ message: "Error executing script." });
                        }
                    }
                );
            } else {
                sendResponse({ message: "No active tab found." });
            }
        });

        // Returning true to indicate we're sending a response asynchronously
        return true;
    }

    // Listen for the selected trimester
    if (message.action === "trimesterSelected") {
        setLog(message, sender);

        let courseTotal = message.courseTotal;
        console.log(message.message);
        console.log("Extraction Timeout (ms): ", extractionTimeout); 
        console.log("Trimester course total:", courseTotal);
        console.log("Trimester title:", message.trimesterTitle);

        // Start extracting classes
        for (let i=0 ; i<courseTotal; i++){
            getActiveTabId((tabId) => {
                if (tabId !== null) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        world: 'MAIN',
                        func: (index) => {
                            /**
                             * 
                             * @param {*} selector 
                             * @param {*} callback 
                             * @param {*} timeout 
                             * @returns 
                             */
                            function waitForElement(selector, callback, timeout) {
                                const element = document.querySelector(selector);
                                if(element) {
                                    callback(element);
                                    return;
                                }

                                const observer = new MutationObserver((mutations, obs) => {
                                    const element_ = document.querySelector(selector);
                                    if(element_) {
                                        obs.disconnect();
                                        callback(element_);
                                    }
                                });

                                observer.observe(document.body, {
                                    childList: true,
                                    subtree: true
                                });

                                // Disconnect observer after timeout
                                setTimeout(() => {
                                    observer.disconnect();
                                    console.warn(`wairForElement: Element ${selector} not within ${timeout}ms`);
                                }, timeout);
                            }
                            window.addEventListener('load', function() {
                                // Select courses (descending order)
                                OnRowAction(this, `SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$${index}`);
                                console.log('test')
                            });

                            // Array.from(document.querySelectorAll('div.ps_box-button span.ps-button-wrapper a.ps-button'))
                            //     .find(element => element.textContent === 'View Classes').click();
                        },
                        args: [i]
                    });
                }
            });
        }

    }
});

/**
 * Function that will be injected into the active tab, listen for click event on the 'Trimester Row' element
 * @returns {String} - Message to indicate if the row element is found and listener attached
 */
function getTrimesterClicked() {
    const row = document.querySelectorAll('tr[data-role="button"]');
    const planner = document.querySelector('span.ps-text[id="PANEL_TITLElbl"]');

    if (row && planner.textContent === "Planner") {
        alert("You may now select a trimester to extract.");

        console.log("Trimester rows element found:", row);
        console.log("Planner element found:", planner);
        Array.from(row).forEach((row_, index) => {
            row_.addEventListener("click", function () {
                const courseTotal = document.querySelector(`span.ps_box-value[id="SSR_PLNR_FL_WRK_COURSES_ATTEMPTED$${index}"`).textContent.trim(); 
                const trimesterTitle = document.querySelector(`a.ps-link[id="SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$${index}"]`).textContent.trim();

                // Send the result back to the background script
                chrome.runtime.sendMessage({ action: "trimesterSelected", courseTotal: courseTotal, trimesterTitle: trimesterTitle, message: `Trimester row selected: ${index}` });
            });
        });
        return "Row element found and listener attached.";  
    } else {
        return "Row element not found.";
    }
}

/**
 * Function to set log in background console
 * @param {Object} message
 * @param {Object} sender
 */
function setLog(message, sender) {
    console.log(message);
    console.log(sender);
}
