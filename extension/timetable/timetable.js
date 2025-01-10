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

        // ---------------------- HTML DOM ELEMENTS ------------------------------//
        // ---------------------- DAYS OF WEEK------------------------------------//
        // Days of week checkboxes
        const allday = document.getElementById("allday");
        const monday = document.getElementById("monday");
        const tuesday = document.getElementById("tuesday");
        const wednesday = document.getElementById("wednesday");
        const thursday = document.getElementById("thursday");
        const friday = document.getElementById("friday");
        const saturday = document.getElementById("saturday");
        const sunday = document.getElementById("sunday");

        const weekdays = [monday, tuesday, wednesday, thursday, friday, saturday, sunday]; 

        // When "All Day" is clicked
        allday.addEventListener("click", () => {
            if (allday.checked) {
                weekdays.forEach(checkbox => {
                    checkbox.setAttribute("disabled", "true");
                    checkbox.checked = false;
                });
            } else {
                weekdays.forEach(checkbox => {
                    checkbox.removeAttribute("disabled");
                });
            }
        });

        // When any weekday checkbox is clicked
        weekdays.forEach(checkbox => {
            checkbox.addEventListener("click", () => {
                // Check if all weekdays are checked
                const allChecked = weekdays.every(checkbox => checkbox.checked);

                if (allChecked) {
                    // Enable "All Day" and uncheck all weekdays
                    allday.checked = true;
                    weekdays.forEach(checkbox => {
                        checkbox.setAttribute("disabled", "true");
                        checkbox.checked = false;
                    });
                } else {
                    // Uncheck "All Day" if not all weekdays are checked
                    allday.checked = false;
                }
            });
        });

        // ---------------------- SLIDERS ------------------------------------//
        // Filters 
        const src_filters = chrome.runtime.getURL('../scripts/helpers/filters.js');
        const filters = await import(src_filters);

        // Time
        filters.getTimeSliders();

        // Class closeness slider
        const slider = document.getElementById("class_closeness");
        const output = document.getElementById("class_closeness_value");

        // Update the span value when the slider changes
        slider.addEventListener("input", (event) => {
            output.textContent = event.target.value;
        });

        // Set initial value when the page loads
        output.textContent = slider.value;

        // ---------------------- DRAG AND DROP -----------------------------------//
        const src_dragndrop = chrome.runtime.getURL('../scripts/helpers/dragndrop.js');
        const dragndrop = await import(src_dragndrop);

        dragndrop.getDragDrop();

        // ---------------------- TIMETABLE TABLE ---------------------------------//
        // Timetable table
        const src_table = chrome.runtime.getURL('../scripts/helpers/table.js');
        const table = await import(src_table);

        dataset = await getDataset;
        table.getTable(dataset);

        // ------------------------- FITNESS FUNCTIONS ---------------------------//
        const src_fitness = chrome.runtime.getURL('../scripts/helpers/fitness.js');
        const fitness = await import(src_fitness); 

    });
})();