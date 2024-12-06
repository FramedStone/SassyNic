console.log("content script successfully injected");

// TODO: create observe function for different elements to be observed (return(callback))

// TODO: observe trimester title change
//document.querySelector('span.ps-text[id="PANEL_TITLElbl"]').textContent 

const observer = new MutationObserver(() => {
    const target = document.querySelector('span.ps-text[id="PANEL_TITLElbl"]');
    if (target) {
        console.log("Target found:", target.textContent);
        chrome.runtime.sendMessage({ action: "found_trimesterTitle", message: target.textContent });
        observer.disconnect(); // Stop observing once the target is found
    }
});

observer.observe(document.body, { childList: true, subtree: true });

console.log("Observing for changes in the DOM...");

// const config = { attributes: true, childList: true, subtree: true };
// const callback = (mutationList) => {

// }

// TODO: 'sendMessage' back to 'background.js' to execute the next step