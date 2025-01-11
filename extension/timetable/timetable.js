console.log("timetable.js loaded");
chrome.runtime.sendMessage({ action: "timetablejsInjected" });

(async() => {
    document.addEventListener("DOMContentLoaded", async() => {
        let dataset;

        // ---------------------- MESSAGE PASSING --------------------------------//
        // Listen message from background.js
        const getDataset = new Promise((resolve) => {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if(message.action === "passDataset") {
                    dataset = message.dataset;
                    resolve(dataset);

                    sendResponse({ status: "Pruned dataset received successfully from background.js" });
                }
                return true; // keep message port open for receiving message
            });
        });
        dataset = await getDataset; // load dataset

        // ---------------------- HTML DOM ELEMENTS ------------------------------//
        // ---------------------- FILTERS ----------------------------------------//
        // Filters 
        const src_filters = chrome.runtime.getURL('../scripts/helpers/filters.js');
        const filters = await import(src_filters);

        filters.getDaysOfWeek();                // Days of week 
        filters.getTimeSliders();               // Time
        filters.getClassCloseness();            // Class Closeness
        filters.getInstructors(dataset);        // Instructors


        // ---------------------- DRAG AND DROP -----------------------------------//
        const src_dragndrop = chrome.runtime.getURL('../scripts/helpers/dragndrop.js');
        const dragndrop = await import(src_dragndrop);

        dragndrop.getDragDrop();

        // ---------------------- TIMETABLE TABLE ---------------------------------//
        // Timetable table
        const src_table = chrome.runtime.getURL('../scripts/helpers/table.js');
        const table = await import(src_table);

        table.getTable(dataset);

        // ------------------------- FITNESS FUNCTIONS ---------------------------//
        const src_fitness = chrome.runtime.getURL('../scripts/helpers/fitness.js');
        const fitness = await import(src_fitness); 

        // Observe filter's ranking changes
        observeRanks("draggable-item");
        observeRanks("draggable-item-child");

        // Observer filter's elements value changes
        observeFiltersValues((result) => {
            const elementId = result.element.id;
            
            if (result.type === 'checkbox') {
                console.log("--------------------------------------------------------------");
                console.log(`${result.element.id} is ${result.value}`);
                console.log(result.element);
                console.log("--------------------------------------------------------------");
            }
            else if (result.type === 'range') {
                const valueDisplay = document.getElementById(`${elementId}_value`);
                if (valueDisplay) {
                    valueDisplay.textContent = result.percentage;
                }
                console.log("--------------------------------------------------------------");
                console.log(`${elementId}: ${result.value} (${result.percentage}%)`);
                console.log(result.element);
                console.log("--------------------------------------------------------------");
            }
            else if (result.type === 'time') {
                console.log("--------------------------------------------------------------");
                console.log(`${elementId}: ${result.value}`);
                console.log(result.element);
                console.log("--------------------------------------------------------------");
            }
        });

    });
})();

// ------------------------- HELPER FUNCTIONS ---------------------------//
/**
 * Function to observe 'data-rank' changes in filter's elements
 * @param {String} className - element's class name
 */
function observeRanks(className) {
    const elements = document.querySelectorAll(`.${className}`); // Observe all elements with the given class
    const changes = []; // To collect rank changes for grouped logging

    // MutationObserver object
    const observer = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
            if (mutation.type === "attributes" && mutation.attributeName === "data-rank") {
                const target = mutation.target;
                const newRank = target.getAttribute("data-rank");

                // Collect change for grouped output
                changes.push({ element: target, newRank });
            }
        }

        // If there are changes, log them grouped with separators
        if (changes.length > 0) {
            // console.log("--------------------------------------------------------------");
            console.log("\nFILTERS");
            changes.forEach(({ element, newRank }) => {
                console.log(
                    element.className.includes('draggable-item-child') ? `new rank: ${newRank}, ${element.querySelector('label').textContent}` // draggable-item-child
                    : ` new rank: ${newRank},${element.querySelector('span').textContent.replace(/[0-9]*./, "")}` // dragggable-item
                );
            });
            console.log("--------------------------------------------------------------");

            // Clear changes after logging to avoid duplicate entries
            changes.length = 0;
        }
    });

    // Start observing for rank attribute changes
    elements.forEach((element) => {
        observer.observe(element, {
            attributes: true,
            attributeFilter: ["data-rank"] // Observe only "data-rank"
        });
    });

    console.log("--------------------------------------------------------------");
    console.log("Observer attached: 'data-rank'");
    // console.log("--------------------------------------------------------------");
}

/**
 * Function to observe 'value' changes in filter's elements
 * @param {Object} callback 
 * @returns {null} - cleanup function
 */
function observeFiltersValues(callback) {
    const container = document.getElementById('filters');
    if (!container) {
        console.error("Element with id 'filters' not found.");
        return;
    }

    // Store elements that already have listeners
    const processedElements = new WeakSet();
    let hasAttachments = false;

    // Print divider line
    const printDivider = () => {
        console.log('--------------------------------------------------------------');
    };

    // Handle checkbox changes
    const handleCheckboxes = () => {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        let newAttachments = 0;
        
        checkboxes.forEach(checkbox => {
            if (!processedElements.has(checkbox)) {
                const changeHandler = (event) => {
                    callback({
                        type: 'checkbox',
                        value: event.target.checked ? 'checked' : 'unchecked',
                        element: event.target
                    });
                };
                
                checkbox.addEventListener('change', changeHandler);
                processedElements.add(checkbox);
                newAttachments++;
            }
        });

        if (newAttachments > 0) {
            if (!hasAttachments) {
                printDivider();
                hasAttachments = true;
            }
            console.log('Observer attached: checkboxes');
        }
    };

    // Handle time input changes
    const handleTimeInputs = () => {
        const timeInputs = container.querySelectorAll('input[type="time"]');
        let newAttachments = 0;
        
        timeInputs.forEach(timeInput => {
            if (!processedElements.has(timeInput)) {
                const changeHandler = (event) => {
                    callback({
                        type: 'time',
                        value: event.target.value,
                        element: event.target
                    });
                };
                
                timeInput.addEventListener('change', changeHandler);
                processedElements.add(timeInput);
                newAttachments++;
            }
        });

        if (newAttachments > 0) {
            if (!hasAttachments) {
                printDivider();
                hasAttachments = true;
            }
            console.log('Observer attached: time inputs');
        }
    };

    // Handle range slider changes
    const handleRangeInputs = () => {
        const rangeInputs = container.querySelectorAll('input[type="range"]');
        let newAttachments = 0;
        
        rangeInputs.forEach(rangeInput => {
            if (!processedElements.has(rangeInput)) {
                const inputHandler = (event) => {
                    const value = event.target.value;
                    const max = parseFloat(event.target.max);
                    const percentage = Math.round((value / max) * 100);
                    
                    callback({
                        type: 'range',
                        value: value,
                        percentage: percentage,
                        element: event.target
                    });
                };
                
                rangeInput.addEventListener('input', inputHandler);
                processedElements.add(rangeInput);
                newAttachments++;
            }
        });

        if (newAttachments > 0) {
            if (!hasAttachments) {
                printDivider();
                hasAttachments = true;
            }
            console.log('Observer attached: sliders');
        }
    };

    // Initialize observers for all input types
    handleCheckboxes();
    handleTimeInputs();
    handleRangeInputs();

    // Print final divider if any attachments were made
    if (hasAttachments) {
        printDivider();
    }

    // Optional: Observe DOM changes to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                handleCheckboxes();
                handleTimeInputs();
                handleRangeInputs();
            }
        });
    });

    // Start observing the container for added nodes
    observer.observe(container, {
        childList: true,
        subtree: true
    });

    // Return cleanup function
    return () => {
        observer.disconnect();
        processedElements.clear();
    };
}