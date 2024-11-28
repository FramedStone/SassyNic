// get active tab
export function getActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active : true, currentWindow: true}, (tabs) => {
            if(chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else if(tabs.length === 0) {
                reject(new Error('No active tab found'));
            } else {
                resolve(tabs[0]); // return the first active tab object
            }
        });
    });
}

// inject script into active tab
export function injectScript(file) {
    getActiveTab()
        .then((tab) => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: [file]
            });
        })
        .catch((error) => {
            console.error("Failed to inject script: ", error);
        });
}