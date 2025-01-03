// Listen message from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "passDataset") {
        console.log(message.dataset);

        sendResponse({ status: "Pruned dataset received successfully from background.js" });
    }
});