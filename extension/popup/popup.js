// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   document.getElementById('btnExtraction').addEventListener('click', () => {
      // send message to background.js to start extraction 
      chrome.runtime.sendMessage({ action: "startExtraction" });
   });
});