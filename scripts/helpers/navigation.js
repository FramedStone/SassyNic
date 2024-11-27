/**
 * Function that clicks the 'Planner' element using 'MouseEvent'
 */
function clickPlanner() {
    const liElements = document.querySelectorAll("ul.psa_list-linkmenu li");
    let found = false;

    for (let liElement of liElements) {
        const spanText = liElement.querySelector("span.ps-text");
        if (spanText && spanText.textContent.trim() === "Planner") {
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            liElement.dispatchEvent(event);
            found = true;
            break;
        }
    }
    if (!found) {
        console.log("Planner element not found");
    }
}

// Expose the function under a unique namespace to avoid conflicts
window.MyExtensionHelpers = window.MyExtensionHelpers || {}; // can change myExtensionHelpers 
window.MyExtensionHelpers.clickPlanner = clickPlanner;

console.log("navigation.js loaded and clickPlanner is available.");
