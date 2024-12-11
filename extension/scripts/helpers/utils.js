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