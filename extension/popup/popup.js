// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   document.getElementById('btnExtraction').addEventListener('click', () => {
      const choice = confirm("\nContinue with extraction (OK)\nClose to watch the tutorial (Cancel)\n\nNote: Make sure to watch the tutorial to prevent any unwanted issues!");

      if(choice) {
         // send message to background.js to start extraction 
         chrome.runtime.sendMessage({ action: "startExtraction" });
      } else {
         chrome.tabs.create({ url: "./extension/tutorial-videos/index.html" });
      }
   });
});