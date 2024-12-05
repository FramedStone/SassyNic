console.log("content script successfully injected");

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed"); 

});

// TODO: create observe function for different elements to be observed (return(callback))

// TODO: observe trimester title change
//document.querySelector('span.ps-text[id="PANEL_TITLElbl"]').textContent 

// TODO: 'sendMessage' back to 'background.js' to execute the next step