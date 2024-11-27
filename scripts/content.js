// Verify that the helper namespace exists
if (window.MyExtensionHelpers && typeof window.MyExtensionHelpers.clickPlanner === 'function') {
    console.log("clickPlanner function is available.");
} else {
    console.error("clickPlanner function is not available.");
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "clickPlanner") {
        console.log("Received clickPlanner action.");
        if (window.MyExtensionHelpers && typeof window.MyExtensionHelpers.clickPlanner === 'function') {
            window.MyExtensionHelpers.clickPlanner();
            sendResponse({ status: "Planner clicked" });
        } else {
            console.error("clickPlanner function not found.");
            sendResponse({ status: "clickPlanner function not found." });
        }
    }
});
