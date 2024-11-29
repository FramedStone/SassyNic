// Navigate to 'SassyNic' website on installed
// chrome.runtime.onInstalled.addListener(function() {
//     chrome.tabs.create({ url: 'https://sassynic.com' });
// });

// listen for message from popup.js
importScripts('./helpers/utils.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { 
    if (message.action === "startExtraction") {
        setLog(message, sender);

        // Call the helper function to get the tabId
        getActiveTabId((tabId) => {
            if (tabId !== null) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                        return document.querySelector('input#ps_submit_button').value;
                    }
                }, (result) => {
                    console.log(result[0].result); // result[0] because the response is an array
                    sendResponse({ message: result[0].result });
                });
            } else {
                sendResponse({ message: "No active tab found." });
            }
        });

        // Returning true to indicate we're sending a response asynchronously
        return true;
    }
});

/**
 * Function to set log in background console
 * @param {Object} message 
 * @param {Object} sender 
 */
function setLog(message, sender) {
    console.log(message);
    console.log(sender);
}
