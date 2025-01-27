import { getActiveTabId, onTabUpdated } from './helpers/utils.js';
import { pruneSchedule } from './helpers/constraints.js';

// Navigate to 'SassyNic' github wiki on installed
chrome.runtime.onInstalled.addListener(function() {
    chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic' });
});

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

        /**
         * dataset ->
         */

        chrome.storage.local.get(null, function(items) {
            let dataset = items;
            let pureComb = backtrack_(dataset);
            let prunedComb = backtrack(dataset);
            console.log("Dataset: ", dataset);
            console.log("Pure backtracking result: ", pureComb);
            console.log("Backtracking with daytime conflict + seats availability: ", prunedComb);

            // Passing pruned combination to 'timetable.html'
            chrome.tabs.create({ url: chrome.runtime.getURL("extension/timetable/timetable.html") }, () => {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    if(message.action === "timetablejsInjected") {
                        chrome.runtime.sendMessage({ action: "passDataset", dataset: prunedComb }, (response) => {
                            console.log("Pruned dataset sent to timetable.html");

                            // Clear chrome storage
                            chrome.storage.local.clear();
                            console.log("Dataset cleared from chrome storage.");

                            console.log(response.status);
                        });
                    }
                    return true; // keep message port open for receiving message
                });
            });

        });

        // Pure Backtracking
        function backtrack_(data, courses = Object.keys(data), current = [], final = []) {
            // Exit factor
            if(current.length === courses.length) {
                final.push([...current]);
                return;
            }

            const course = courses[current.length];
            const options = data[course].class;
            const title = data[course].title;
            const code = data[course].code;

            for(let option of options) {
                current.push({title: title, code: code, option});
                backtrack_(data, courses, current, final, title);
                current.pop(); // Backtrack
            }

            return final;
        }

        // Backtracking with daytime conflict, seats availability contraints 
        function backtrack(data, courses = Object.keys(data), current = [], final = []) {
            // Exit factor
            if (current.length === courses.length) {
                if (!pruneSchedule(current)) {
                    final.push([...current]);
                }
                return;
            }

            const course = courses[current.length];
            const options = data[course].class;
            const title = data[course].title;
            const code = data[course].code;

            for (let option of options) {
                current.push({ title, code, option });
                backtrack(data, courses, current, final);
                current.pop(); // Backtrack
            }

            return final;
        }

    }
});