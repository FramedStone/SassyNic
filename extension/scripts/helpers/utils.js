// Helper function to get the active tabId
export function getActiveTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
            callback(tabs[0].id);  // Pass the tabId to the callback function
        } else {
            console.error("No active tab found.");
            callback(null);  // In case no active tab is found
        }
    });
}

// Helper function to get updated tab
export function onTabUpdated(callback) {
    const listener = (tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && tab.active) {
            callback(tabId);
            chrome.tabs.onUpdated.removeListener(listener);
        }
    };
    chrome.tabs.onUpdated.addListener(listener);
}

// Helper function to lead users to associated error section within the wiki
export function getError(code) {
    chrome.tabs.create({
        url: `https://github.com/FramedStone/SassyNic/wiki/Error-Reference#${code}`
    });
}