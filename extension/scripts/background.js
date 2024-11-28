import { getActiveTab, injectScript } from "./helpers/utils";

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

// listen for inject function calling from content_scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "injectScript") {
        setLog(message, sender);
        const result = injectScript(message.file);
        sendResponse({message: result});
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