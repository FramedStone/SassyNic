// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   // Auto Login
   const checkbox = document.getElementById("switch-auto-login");

   // Load saved state from storage when popup opens
   chrome.storage.local.get("autoLoginEnabled", function (data) {
      console.log("Loaded from storage:", data);
      checkbox.checked = data.autoLoginEnabled || false; // Default to false if not set
   });

   checkbox.addEventListener("change", function () {
      const isChecked = checkbox.checked;

      // Save state to storage
      chrome.storage.local.set({ autoLoginEnabled: isChecked }, function () {
         console.log("State saved:", isChecked);
      });
   });

   // Timetable
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