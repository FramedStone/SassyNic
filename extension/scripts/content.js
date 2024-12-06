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

            setTimeout(() => {
                document.getElementById('PLANNER_ITEMS_NFF$0_row_0').click();
            }, 3000);

        } else {
            // Attach listener for the load event
            window.addEventListener("load", () => {
                console.log("Test");
            });
        }
    }
});