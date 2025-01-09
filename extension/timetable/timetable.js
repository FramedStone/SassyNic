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
        // class closeness slider
        const slider = document.getElementById("class_closeness");
        const output = document.getElementById("class_closeness_value");

        // Update the span value when the slider changes
        slider.addEventListener("input", (event) => {
            output.textContent = event.target.value;
        });

        // Set initial value when the page loads
        output.textContent = slider.value;

        // timetable table
        const src_table = chrome.runtime.getURL('../scripts/helpers/table.js');
        const table = await import(src_table);

        dataset = await getDataset;
        table.getTable(dataset);

        // ------------------------- FITNESS FUNCTIONS ---------------------------//
        const src_fitness = chrome.runtime.getURL('../scripts/helpers/fitness.js');
        const fitness = await import(src_fitness); 

    });

})();