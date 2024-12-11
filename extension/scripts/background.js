import { getActiveTabId } from './helpers/utils.js';

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
                            console.log(result[0].result);
                        } else {
                            console.log("No result found.");
                        }
                    }
                );
            } else {
                console.log("No active tab found.");
            }
        });

        // Returning true to indicate we're sending a response asynchronously
        return true;
    }

    // Listen for the selected trimester
    if (message.action === "trimesterSelected") {
        setLog(message, sender);

        let courseIndex = message.courseTotal - 1;
        console.log(message.message);
        console.log("Extraction Timeout (ms): ", extractionTimeout); 
        console.log("Trimester course total:", message.courseTotal);
        console.log("Trimester title:", message.trimesterTitle);

        // wait for the page to be fully loaded
        const onTabUpdated = (tabId, changeInfo, tab) => {
            if(changeInfo.status === "complete") {
                getActiveTabId((tabId) => {
                    if(tabId !== null) {
                        chrome.tabs.sendMessage(tabId, { action: "extractTrimester", courseIndex: courseIndex, trimesterTitle: message.trimesterTitle });
                        chrome.tabs.onUpdated.removeListener(onTabUpdated);
                    } else {
                        console.log("No active tab found.");
                    }
                });
            }
        };
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        
    }

    if (message.action === "viewClasses_") {
        setLog(message, sender);

        // wait for the page to be fully loaded
        const onTabUpdated = (tabId, changeInfo, tab) => {
            if(changeInfo.status === "complete") {
                getActiveTabId((tabId) => {
                    if(tabId !== null) {
                        chrome.tabs.sendMessage(tabId, { action: "viewClasses" });
                        chrome.tabs.onUpdated.removeListener(onTabUpdated);
                    } else {
                        console.log("No active tab found.");
                    }
                });
            }
        };
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        
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
