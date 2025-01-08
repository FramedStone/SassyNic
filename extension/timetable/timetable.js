(async() => {
    // Import helper functions dynamically
    const src = chrome.runtime.getURL('../scripts/helpers/fitness.js');
    const fitness = await import(src); // fitness.js object

    console.log("timetable.js loaded");
    chrome.runtime.sendMessage({ action: "timetablejsInjected" });

    // Listen message from background.js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if(message.action === "passDataset") {
            chrome.storage.local.set({ dataset: message.dataset }, () => {
                console.log(message.dataset);

                sendResponse({ status: "Pruned dataset received successfully from background.js and saved into local chrome storage" });
            });
        }
        return true; // keep message port open for receiving message
    });

})();