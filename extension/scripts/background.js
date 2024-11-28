// Navigate to 'SassyNic' website on installed
// chrome.runtime.onInstalled.addListener(function() {
//     chrome.tabs.create({ url: 'https://sassynic.com' });
// });

// listen for message from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { 
    if(message.action === "startExtraction") {
        setLog(message, sender);
        sendResponse({message: "Message Received from popup.js"})
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

/**
 * Function that will get the current DOM's active tab ID
 * @returns {Promise<number>} Promise that resolves to the ID of the active tab
 */
function getActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else if (tabs.length === 0) {
                reject(new Error("No active tab found"));
            } else {
                resolve(tabs[0].id);
            }
        });
    });    
}

/**
 * Function that will inject the script into target DOM's tab dynamically
 * @param {File} file 
 */
function injectScript(file) {
    return getActiveTab()
        .then((tabId) => {
            return new Promise((resolve, reject) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: [file]
                }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(`Script ${file} injected successfully.`);
                    }
                });
            });
        })
        .catch((error) => {
            console.error("Failed to inject script:", error);
            throw error;
        });    
}
