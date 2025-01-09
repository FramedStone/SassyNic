(async() => {
    document.addEventListener("DOMContentLoaded", async() => {
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

        table.getTable("test");

        // ------------------------- FITNESS FUNCTIONS ---------------------------//
        const src_fitness = chrome.runtime.getURL('../scripts/helpers/fitness.js');
        const fitness = await import(src_fitness); 

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
    });

})();