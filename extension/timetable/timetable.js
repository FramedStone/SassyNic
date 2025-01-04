// Listen message from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "passDataset") {
        chrome.storage.local.set({ dataset: message.dataset }, () => {
            console.log(message.dataset);

            sendResponse({ status: "Pruned dataset received successfully from background.js and saved into local chrome storage" });
        });
    }
});