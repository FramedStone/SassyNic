console.log("auto_login.js injected");

// CliC OTP page
// if(window.location.href.startsWith("https://clic.mmu.edu.my/psp/csprd/?&cmd=login")) {
    // Only observe when autoLogin is toggled on
    chrome.storage.local.get("autoLoginEnabled", function (data) {
        console.log("Loaded from storage:", data);
        if (data.autoLoginEnabled) {
            // Function to check for the target element and extract the timestamp
            function checkForTimestamp() {
                const targetNode = document.getElementById("ptloginerrorcont");
                if (targetNode) {
                    const text = targetNode.innerText;
                    const match = text.match(/\b\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2}:\d{2} [APM]{2}\b/);
                    if (match) {
                        const timestamp = match[0];
                        console.log("timestamp found:", timestamp);
                        // send message to background.js to scrape OTP from outlook 
                        chrome.runtime.sendMessage({ action: "autoLogin", timestamp: timestamp }); 
                    }
                }
            }

            // Create a MutationObserver on the document body to detect when the target element is added
            const observer = new MutationObserver((mutations, obs) => {
                checkForTimestamp();
            });

            // Start observing the document body for changes (child nodes added or removed)
            observer.observe(document.body, { childList: true, subtree: true });
            console.log('Observing CliC OTP page.');
            checkForTimestamp();

            observer.disconnect();
        }
    });
// }