import { getActiveTabId, onTabUpdated } from './helpers/utils.js';

// Navigate to 'SassyNic' website on installed
// chrome.runtime.onInstalled.addListener(function() {
//     chrome.tabs.create({ url: 'https://sassynic.com' });
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "startExtraction") {
        console.log(message);

        getActiveTabId(tabId => {
            if(tabId !== null) {
                chrome.tabs.sendMessage(tabId, { action: "startExtraction_", term: message.term, index: 0, tabId: tabId });
                console.log("startExtraction_ sent to extraction.js");
            } else {
                console.log("No active tab found!");
            }
        });
    }

    if(message.action === "selectedCourse") {
        console.log(message);

        onTabUpdated((tabId) => {
            if(tabId !== null) {
                chrome.tabs.sendMessage(message.tabId, { action: "viewClasses_", term: message.term, index: message.index, tabId: message.tabId });
                console.log("viewClasses sent to extraction.js");
            } else {
                console.log("No active tab found!");
            }
        });
    }

    if(message.action === "viewClasses") {
        console.log(message);

        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            world: 'MAIN',
            func: () => {
                document.querySelector('div.ps_box-button.psc_primary span a').click();
            }
        }).then(() => {
            onTabUpdated(tabId => {
                if(tabId !== null) {
                    chrome.tabs.sendMessage(message.tabId, { action: "selectTerm_", term: message.term, index: message.index, tabId: message.tabId });
                    console.log("selectTerm_ sent to extraction.js");
                } else {
                    console.log("No active tab found!");
                }
            });
        });
    }

    if(message.action === "selectTerm") {
        console.log(message);

        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            world: 'MAIN',
            func: (term) => {
                Array.from(document.querySelectorAll('td.ps_grid-cell div.ps_box-group.psc_layout span.ps-link-wrapper a.ps-link')).find(element => element.textContent.trim() === term).click()  
            },
            args: [message.term]
        }).then(() => {
            onTabUpdated(tabId => {
                if(tabId !== null) {
                    chrome.tabs.sendMessage(message.tabId, { action: "extractClassDetails_", term: message.term, index: message.index, tabId: message.tabId });
                    console.log("extractClassDetails_ sent to extraction.js");
                } else {
                    console.log("No active tab found!");
                }
            });
        });
    }

    if(message.action === "extractClassDetails") {
        console.log(message);

        // Put dataset into chrome storage with 2 keys: message.title and message.code
        chrome.storage.local.set({ [message.title]: message.dataset }, () => {
            console.log("Dataset saved to storage: ", message.title);
            console.log(message.dataset);
        });

        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            world: 'MAIN',
            func: () => {
                window.history.back();
            }
        }).then(() => {
            onTabUpdated(tabId => {
                if(tabId !== null) {
                    chrome.scripting.executeScript({
                        target: { tabId: message.tabId },
                        world: 'MAIN',
                        func: () => {
                            const waitForElement = ({ selector, method = 'querySelectorAll' }) => {
                                return new Promise((resolve) => {
                                    const observer = new MutationObserver(() => {
                                        const elements = document[method](selector);
                                        if (elements && (elements.length || elements)) {
                                            observer.disconnect(); // Stop observing once the element is found
                                            resolve(elements);
                                        }
                                    });

                                    // Observe changes in the entire document
                                    observer.observe(document.body, { childList: true, subtree: true });
                                });
                            };

                            waitForElement({
                                selector: "div.ps_box-button.psc_primary span a",
                                method: "querySelector",
                                attributes: {
                                    onclick:true
                                }
                            }).then(() => {
                                window.history.back()
                            })
                        }
                    }).then(() => {
                        let index = message.index + 1; // Increment index to move to the next course
                        onTabUpdated(tabId => {
                            if(tabId !== null) {
                                chrome.tabs.sendMessage(message.tabId, { action: "startExtraction_", term: message.term, index: index, tabId: message.tabId });
                                console.log("startExtraction_ sent to extraction.js with index: ", index);
                            } else {
                                console.log("No active tab found!");
                            }
                        });
                    })
                } else {
                    console.log("No active tab found!");
                }
            });
        });
    }

    if(message.action === "extractionCompleted") {
        chrome.storage.local.get(null, function(items) {
            console.log(items);
        });
    }
});