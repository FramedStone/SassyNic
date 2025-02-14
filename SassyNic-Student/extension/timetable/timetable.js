console.log("timetable.js loaded");
chrome.runtime.sendMessage({ action: "timetablejsInjected" });

(async() => {
    document.addEventListener("DOMContentLoaded", async() => {
        // ---------------------- WEBPAGE INTRO -----------------------------------//
        const texts = [
            "It's about damn time",
            "Once again, the new Trimester has come...",
            "Remember all those hard times on trying to find your perfect timetable?",
            "All those struggles you and your fellow friends had, trying to avoid certain days to not have classes",
            "Some of you found it, Some of you failed",
            "Ones got mad, Ones cried, and Ones accepted the faith",
            "Don't worry, this time around everything will be changed",
            "Welcome to the Magical World",
            "SassyNic"
        ];

        let currentTextIndex = 0;
        const mainElement = document.querySelector('.main');
        const animatedTextElement = document.getElementById('animated-text');
        const contentElement = document.getElementById('content');

        // Dynamically apply reset styles
        function applyResetStyles() {
            const style = document.createElement('style');
            style.id = 'resetStyles';
            style.textContent = `
                * {
                    box-sizing: border-box;
                    padding: 0;
                    margin: 0;
                }
            `;
            document.head.appendChild(style);
        }

        // Remove reset styles and apply padding
        function removeResetStylesAndSetPadding() {
            const resetStyles = document.getElementById('resetStyles');
            if (resetStyles) {
                resetStyles.remove();
            }
            document.body.style.padding = '10px'; // Apply 10px padding after animation
        }

        // Add intro class initially
        mainElement.classList.add('intro'); 

        function showNextText() {
            if (currentTextIndex < texts.length) {
                // Show current text
                animatedTextElement.textContent = texts[currentTextIndex];
                animatedTextElement.classList.add('show');
                animatedTextElement.classList.remove('hide');

                // Schedule next text
                setTimeout(() => {
                    animatedTextElement.classList.remove('show');
                    animatedTextElement.classList.add('hide');

                    setTimeout(() => {
                        currentTextIndex++;
                        if (currentTextIndex < texts.length && currentTextIndex !== texts.length - 1) {
                            showNextText();
                        } else if (currentTextIndex === texts.length - 1) {
                            showNextText();
                            // Play audio during last text
                            const audio = document.getElementById('backgroundAudio');
                            audio.play().catch(error => console.log('Audio playback failed', error));
                        } else {
                            completeIntro();
                        }
                    }, 1000); // Wait for fade out before changing text
                }, 3500); // Show each text for 3.5 seconds
            }
        }

        function completeIntro() {
            mainElement.classList.remove('intro'); // background color transition back to white
            animatedTextElement.style.display = 'none';
            contentElement.style.display = 'block';

            // Remove reset styles and apply padding
            removeResetStylesAndSetPadding();

            // Remove the skip button
            const skipButton = document.getElementById('skipButton');
            if (skipButton) {
                skipButton.remove();
            }

            // Show mute button after intro is complete
            const muteButton = document.getElementById('muteButton');
            muteButton.style.display = 'block';

            const audio = document.getElementById('backgroundAudio');
            muteButton.addEventListener('click', () => {
                if (audio.muted) {
                    audio.muted = false;
                    muteButton.classList.remove('muted');
                } else {
                    audio.muted = true;
                    muteButton.classList.add('muted');
                }
            });
        } 

        // Apply reset styles and start text animation
        applyResetStyles();
        showNextText();

        // Skip Button Event Listener
        const skipButton = document.getElementById('skipButton');
        skipButton.addEventListener('click', () => {
            completeIntro(); // Skip to the end of the animation
            // Play bgm 
            const audio = document.getElementById('backgroundAudio');
            audio.play().catch(error => console.log('Audio playback failed', error));
        });

        // ---------------------- MESSAGE PASSING --------------------------------//
        // Listen message from background.js
        let datasetChunks = [];
        let expectedChunks = null;

        const getDataset = new Promise((resolve) => {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.action === "passDataset") {
                    // Update extracted term
                    document.getElementById('extractedTerm').textContent = `Extracted Term: ${message.term}`;

                    // Store the chunk at its index
                    datasetChunks[message.index] = message.chunk;
                    expectedChunks = message.total;

                    // Check if all chunks have been received
                    if (datasetChunks.filter(Boolean).length === expectedChunks) {
                        const datasetStr = datasetChunks.join('');
                        const dataset = JSON.parse(datasetStr);
                        resolve(dataset);
                        sendResponse({ status: "Pruned dataset received successfully from background.js" });
                    }
                }
                return true; // keep message port open for async response
            });
        });

        const dataset = await getDataset;
        // Setup unique set to store all subjects title for evaluation purpose later on
        const subjects = new Set();
        dataset[0].forEach((course) => {
            subjects.add({title: course.title, count: 0});
        });
        console.log("Subjects: ", subjects);

        // ---------------------- HTML DOM ELEMENTS ------------------------------//
        // ---------------------- FILTERS ----------------------------------------//
        // Filters 
        const src_filters = chrome.runtime.getURL('extension/scripts/helpers/filters.js');
        const filters = await import(src_filters);

        filters.getDaysOfWeek();                // Days of week 
        filters.getTimeSliders(dataset);        // Time
        filters.getClassGap(dataset);           // Class Gap
        filters.getInstructors(dataset);        // Instructors

        // Filters selection
        const filters_selection = document.querySelectorAll('div.selection input[type="checkbox"]');
        filters_selection.forEach(filter => {
            filter.addEventListener('change', () => {
                if(!filter.checked) {
                    document.querySelector(`div.filters .${filter.id.replace('filter_', '')}`).setAttribute('hidden', 'true');
                    dragndrop.getDragDrop(); // update filter's rank
                }
                if(filter.checked) {
                    document.querySelector(`div.filters .${filter.id.replace('filter_', '')}`).removeAttribute('hidden');
                    dragndrop.getDragDrop(); // udpate filter's rank

                    const filters = document.querySelectorAll('div.filters div.draggable-item:not([hidden])');
                    const children = document.querySelectorAll('div.filters div.draggable-item:not([hidden]) div.draggable-item-child:not([hidden])');

                    if(isAvailable) {
                        fitness.getSortedDataset(dataset_, filters, children, (result) => {
                            console.log(result);
                            table.getTable(dataset_);
                        });
                    } else {
                        fitness.getSortedDataset(dataset, filters, children, (result) => {
                            console.log(result);
                            table.getTable(dataset);
                        });
                    }
                }
            });
        });

        // ---------------------- DRAG AND DROP -----------------------------------//
        const src_dragndrop = chrome.runtime.getURL('extension/scripts/helpers/dragndrop.js');
        const dragndrop = await import(src_dragndrop);

        dragndrop.getDragDrop();

        // ---------------------- TIMETABLE TABLE ---------------------------------//
        // Timetable table
        const src_table = chrome.runtime.getURL('extension/scripts/helpers/table.js');
        const table = await import(src_table);

        // var to switch between all and available sets for every filters' updates
        let isAvailable = true;

        const dataset_ = getAvailableSets();
        table.getTable(dataset_);

        // ---------------------- DISPLAYING OPTION ------------------------------//
        // Prune dataset based on Displaying Option
        const displayingOption = document.getElementById('displayingOption');

        displayingOption.addEventListener("click", () => {
            if(displayingOption.checked) { // checked = Show Available
                isAvailable = true;
                getAvailableSets();
                table.getTable(dataset_); // refresh tatble
            } else {
                isAvailable = false;
                table.getTable(dataset);
            }
        });

        /**
         * Function that will return sets that are available to enroll 
         * @returns dataset with all available sets
         */
        function getAvailableSets() {
            // Reset count for subjects
                subjects.forEach((subject) => {
                    subject.count = 0;
                });

                // Filter from all --> available sets 
                let dataset_ = dataset.map(set => {
                        let filteredSet = set.filter(course => course.option.psc_disabled === "0" && course.option.status === "Open");
                        let filteredSet_ = set.filter(course => course.option.psc_disabled === "1" || course.option.status === "Closed");
                        if (filteredSet_.length > 0) {
                            filteredSet_.forEach(course => {
                                let subject = Array.from(subjects).find(subject => subject.title === course.title);
                                if (subject) {
                                    subject.count++;
                                }
                            });
                        }
                        return filteredSet;
                    }
                );
                console.log(subjects);

                // Further filter out of the filtered dataset_ courses length is not equal to original dataset courses length
                dataset_ = dataset_.filter((set_, index) => 
                    dataset_[index].length === dataset[index].length
                );

                // Alert users which subject(s) all classes are not able to enroll
                let subjects_ = [];
                subjects.forEach(subject => {
                    if(subject.count === dataset.length) {
                        subjects_.push(subject.title);
                    }
                });
                if(subjects_.length > 0) {
                    alert("3001_TIMETABLE_SUBJECT_NOT_AVAILABLE\n\n" + [...subjects_].join('\n'));
                    chrome.tabs.create({
                        url: `https://github.com/FramedStone/SassyNic/wiki/Error-Reference#3001`
                    });
                }
            return dataset_;
        }

        // ------------------------- FITNESS FUNCTIONS ---------------------------//
        const src_fitness = chrome.runtime.getURL('extension/scripts/helpers/fitness.js');
        const fitness = await import(src_fitness); 

        // ---------------------- MUTATION OBSERVERS --------------------------------//
        // Observe ranks for parent elements
        observeRanks("draggable-item", (changes) => {
            console.log("--------------------------------------------------------------");

            changes.forEach(({ element, newRank }) => {
                console.log(
                    `new rank: ${newRank}, ${element.querySelector('span').textContent.replace(/[0-9]*./, "").trim()}`
                );
            });

            const filters = document.querySelectorAll('div.filters div.draggable-item:not([hidden])');
            const children = document.querySelectorAll('div.filters div.draggable-item:not([hidden]) div.draggable-item-child:not([hidden])');
            if(isAvailable) {
                fitness.getSortedDataset(dataset_, filters, children, (result) => {
                    console.log(result);
                    table.getTable(dataset_);
                });
            } else {
                fitness.getSortedDataset(dataset, filters, children, (result) => {
                    console.log(result);
                    table.getTable(dataset);
                });
            }

            // console.log("--------------------------------------------------------------");
        });

        // Observe ranks for child elements
        observeRanks("draggable-item-child", (changes) => {
            console.log("--------------------------------------------------------------");

            changes.forEach(({ element, newRank }) => {
                console.log(
                    `new rank: ${newRank}, ${element.querySelector('label').textContent}`
                );
            });

            const filters = document.querySelectorAll('div.filters div.draggable-item:not([hidden])');
            const children = document.querySelectorAll('div.filters div.draggable-item:not([hidden]) div.draggable-item-child:not([hidden])');
            if(isAvailable) {
                fitness.getSortedDataset(dataset_, filters, children, (result) => {
                    console.log(result);
                    table.getTable(dataset_);
                });
            } else {
                fitness.getSortedDataset(dataset, filters, children, (result) => {
                    console.log(result);
                    table.getTable(dataset);
                });
            }

            // console.log("--------------------------------------------------------------");
        });

        // Observer filter's elements value changes
        observeFiltersValues((result) => {
            const elementId = result.element.id;
            
            if (result.type === 'checkbox') {
                // console.log("--------------------------------------------------------------");
                console.log(`${result.element.id} is ${result.value}`);
                console.log(result.element);
                console.log("--------------------------------------------------------------");

            }
            else if (result.type === 'range') {
                const valueDisplay = document.getElementById(`${elementId}_value`);
                if (valueDisplay) {
                    valueDisplay.textContent = result.value;
                }
                // console.log("--------------------------------------------------------------");
                console.log(`${elementId}: ${result.value} (${result.percentage}%)`);
                console.log(result.element);
                console.log("--------------------------------------------------------------");
            }
            else if (result.type === 'time') {
                // console.log("--------------------------------------------------------------");
                console.log(`${elementId}: ${result.value}`);
                console.log(result.element);
                console.log("--------------------------------------------------------------");
            }
            else if (result.type === 'select') {
                // console.log("--------------------------------------------------------------");
                console.log(`${elementId}: ${result.value}`);
                console.log(result.element);
                console.log("--------------------------------------------------------------");
            }

            const filters = document.querySelectorAll('div.filters div.draggable-item:not([hidden])');
            const children = document.querySelectorAll('div.filters div.draggable-item:not([hidden]) div.draggable-item-child:not([hidden])');
            if(isAvailable) {
                fitness.getSortedDataset(dataset_, filters, children, (result) => {
                    console.log(result);
                    table.getTable(dataset_);
                });
            } else {
                fitness.getSortedDataset(dataset, filters, children, (result) => {
                    console.log(result);
                    table.getTable(dataset);
                });
            }
        }, dragndrop, fitness, table, dataset); // pass dragndrop object to track newly created span(s), and fitness for real time updates
    });
})();

// ------------------------- HELPER FUNCTIONS ---------------------------//
/**
 * Function to observe 'data-rank' changes in filter's elements
 * @param {String} className - element's class name
 */
function observeRanks(className, callback) {
    const elements = document.querySelectorAll(`.${className}`); // Select elements with the given class

    // MutationObserver to monitor attribute changes
    const observer = new MutationObserver((mutationList) => {
        const changes = []; // Accumulate changes for grouped output

        mutationList.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "data-rank") {
                const target = mutation.target;
                const newRank = target.getAttribute("data-rank");

                // Collect structured results for the callback
                changes.push({
                    element: target,
                    newRank,
                });
            }
        });

        // Trigger the callback with accumulated changes if there are any
        if (changes.length > 0 && typeof callback === "function") {
            callback(changes);
        }
    });

    // Start observing the elements for 'data-rank' attribute changes
    elements.forEach((element) => {
        observer.observe(element, {
            attributes: true,
            attributeFilter: ["data-rank"], // Observe only "data-rank"
        });
    });

    console.log(`Observer attached to elements with class '${className}' for 'data-rank' changes.`);
}

/**
 * Function to observe 'value' changes in filter's elements
 * @param {Object} callback 
 * @param {Object} dragndrop 
 * @param {Object} fitness 
 * @returns {null} - cleanup function
 */
function observeFiltersValues(callback, dragndrop, table, fitness, dataset) {
    const container = document.getElementById('filters');
    if (!container) {
        console.error("Element with id 'filters' not found.");
        return;
    }

    // Store elements that already have listeners
    const processedElements = new WeakSet();
    const spansMap = new WeakMap(); // Track spans by parent div and selection
    let hasAttachments = false;

    // Print divider line
    const printDivider = () => {
        console.log('--------------------------------------------------------------');
    };

    // Time conversion utilities
    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        return `${hours.toString().padStart(2, '0')}:00`;
    };

    // Updated helper function to remove a child div and its associated content
    const removeChildDiv = (childDiv) => {
        if (childDiv && childDiv.parentNode) {
            childDiv.remove();
        }
    };

    // Updated span creation and update utility
    const createOrUpdateSpan = (parentDiv, selection, details) => {
        let childDiv;
        if (!spansMap.has(parentDiv)) {
            spansMap.set(parentDiv, {});
        }

        const spansBySelection = spansMap.get(parentDiv);

        // If selection is "Everyday", remove all other child divs
        if (selection === "Everyday") {
            Object.entries(spansBySelection).forEach(([key, existingChildDiv]) => {
                if (key !== "Everyday") {
                    removeChildDiv(existingChildDiv);
                    delete spansBySelection[key];
                }
            });
        } else {
            // If selecting a specific day, remove "Everyday" if it exists
            if (spansBySelection["Everyday"]) {
                removeChildDiv(spansBySelection["Everyday"]);
                delete spansBySelection["Everyday"];
            }
        }

        // Update or create the span for the current selection
        if (spansBySelection[selection]) {
            childDiv = spansBySelection[selection];
            const span = childDiv.querySelector('span.details-display');
            if (span) {
                const strong = span.querySelector('strong');
                const button = span.querySelector('button');
                span.innerHTML = `<strong>${selection}</strong><br>${details} `;
                span.appendChild(button);
            }
        } else {
            childDiv = document.createElement('div');
            childDiv.className = 'draggable-item-child';
            childDiv.setAttribute('data-rank', Object.keys(spansBySelection).length + 1);

            const span = document.createElement('span');
            span.className = 'details-display';

            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'x';
            deleteButton.className = 'delete-button';
            deleteButton.addEventListener('click', () => {
                removeChildDiv(childDiv);
                delete spansBySelection[selection];
            });

            span.innerHTML = `<strong>${selection}</strong><br>${details} `;
            span.appendChild(deleteButton);

            childDiv.appendChild(span);
            parentDiv.appendChild(childDiv);
            spansBySelection[selection] = childDiv;

            dragndrop.getDragDrop(); // track new child elements
            observeRanks("draggable-item-child", (changes) => {
                console.log("--------------------------------------------------------------");

                changes.forEach(({ element, newRank }) => {
                    console.log(
                        `new rank: ${newRank}, ${element.querySelector('span').textContent.replace('x', '')}`
                    );
                });
            });
        }
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

    // Handle time range slider changes
    const handleTimeRangeInputs = () => {
        const timeDivs = container.querySelectorAll('div.time[show-details="true"]');
        let newAttachments = 0;

        timeDivs.forEach(timeDiv => {
            const timeStart = timeDiv.querySelector('#time-start');
            const timeEnd = timeDiv.querySelector('#time-end');
            const startSlider = timeDiv.querySelector('#time-start-slider');
            const endSlider = timeDiv.querySelector('#time-end-slider');
            const selectElement = timeDiv.querySelector('select');

            if (timeStart && timeEnd && startSlider && endSlider && selectElement) {
                const updateDetails = () => {
                    const selection = selectElement.options[selectElement.selectedIndex].text;
                    const startTime = minutesToTime(parseInt(startSlider.value));
                    const endTime = minutesToTime(parseInt(endSlider.value));
                    const details = `Start: ${startTime} End: ${endTime}`;
                    createOrUpdateSpan(timeDiv, selection, details);
                };

                if (!processedElements.has(startSlider)) {
                    let timeout;
                    startSlider.addEventListener('input', () => {
                        // Update display immediately
                        timeStart.value = minutesToTime(parseInt(startSlider.value));
                        updateDetails();  // Update span immediately

                        // Delay only the callback
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            callback({
                                type: 'range',
                                value: startSlider.value,
                                percentage: Math.round((startSlider.value / startSlider.max) * 100),
                                element: startSlider
                            });
                        }, 300);
                    });
                    processedElements.add(startSlider);
                    newAttachments++;
                }

                if (!processedElements.has(endSlider)) {
                    let timeout;
                    endSlider.addEventListener('input', () => {
                        // Update display immediately
                        timeEnd.value = minutesToTime(parseInt(endSlider.value));
                        updateDetails();  // Update span immediately

                        // Delay only the callback
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            callback({
                                type: 'range',
                                value: endSlider.value,
                                percentage: Math.round((endSlider.value / endSlider.max) * 100),
                                element: endSlider
                            });
                        }, 300);
                    });
                    processedElements.add(endSlider);
                    newAttachments++;
                }
            }
        });

        if (newAttachments > 0) {
            if (!hasAttachments) {
                printDivider();
                hasAttachments = true;
            }
            console.log('Observer attached: time sliders');
        }
    };

    // Handle gap slider changes
    const handleGapRangeInputs = () => {
        const gapDivs = container.querySelectorAll('div.gap[show-details="true"]');
        let newAttachments = 0;

        gapDivs.forEach(gapDiv => {
            const gapSlider = gapDiv.querySelector('#class_gap');
            const gapValue = gapDiv.querySelector('#class_gap_value');
            const selectElement = gapDiv.querySelector('select');

            if (gapSlider && gapValue && selectElement) {
                const updateDetails = () => {
                    const selection = selectElement.options[selectElement.selectedIndex].text;
                    const details = `Gap: ${gapSlider.value} minutes`;
                    createOrUpdateSpan(gapDiv, selection, details);
                };

                if (!processedElements.has(gapSlider)) {
                    let timeout;
                    gapSlider.addEventListener('input', () => {
                        // Update display immediately
                        gapValue.textContent = gapSlider.value;
                        updateDetails();  // Update span immediately

                        // Delay only the callback
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            callback({
                                type: 'range',
                                value: gapSlider.value,
                                percentage: Math.round((gapSlider.value / gapSlider.max) * 100),
                                element: gapSlider
                            });
                        }, 300);
                    });
                    processedElements.add(gapSlider);
                    newAttachments++;
                }
            }
        });

        if (newAttachments > 0) {
            if (!hasAttachments) {
                printDivider();
                hasAttachments = true;
            }
            console.log('Observer attached: gap sliders');
        }
    };

    // Handle select option changes
    const handleSelectOptions = () => {
        const selects = container.querySelectorAll('select');
        let newAttachments = 0;

        selects.forEach(select => {
            if (!processedElements.has(select)) {
                const changeHandler = (event) => {
                    const selectedOption = event.target.options[event.target.selectedIndex];
                    callback({
                        type: 'select',
                        value: selectedOption.value,
                        text: selectedOption.text,
                        element: event.target
                    });

                    const parentDiv = event.target.closest('div[show-details="true"]');
                    if (parentDiv) {
                        if (parentDiv.classList.contains('time')) {
                            const startSlider = parentDiv.querySelector('#time-start-slider');
                            const endSlider = parentDiv.querySelector('#time-end-slider');

                            if (startSlider && endSlider) {
                                const startTime = minutesToTime(parseInt(startSlider.value));
                                const endTime = minutesToTime(parseInt(endSlider.value));
                                const details = `Start: ${startTime} End: ${endTime}`;
                                createOrUpdateSpan(parentDiv, selectedOption.text, details);
                            }
                        } else if (parentDiv.classList.contains('gap')) {
                            const gapSlider = parentDiv.querySelector('#class_gap');
                            if (gapSlider) {
                                const details = `Gap: ${gapSlider.value} minutes`;
                                createOrUpdateSpan(parentDiv, selectedOption.text, details);
                            }
                        }
                    }
                };

                select.addEventListener('change', changeHandler);
                processedElements.add(select);
                newAttachments++;
            }
        });

        if (newAttachments > 0) {
            if (!hasAttachments) {
                printDivider();
                hasAttachments = true;
            }
            console.log('Observer attached: selects');
        }
    };

    handleCheckboxes();
    handleTimeInputs();
    handleTimeRangeInputs();
    handleGapRangeInputs();
    handleSelectOptions();
}