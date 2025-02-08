// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   // Auto Login
   const checkbox = document.getElementById("switch-auto-otp-extractor");

   // Load saved state from storage when popup opens
   chrome.storage.local.get("autoLoginEnabled", function (data) {
      console.log("Loaded from storage:", data);
      checkbox.checked = data.autoLoginEnabled || false; // Default to false if not set
   });

   checkbox.addEventListener("change", function () {
      const isChecked = checkbox.checked;

      // Save state to storage
      chrome.storage.local.set({ autoLoginEnabled: isChecked }, function () {
         console.log("Auto OTP Extractor State saved:", isChecked);
      });
   });

   // Timetable
   // Tutorial
   document.getElementById('btnTutorial').addEventListener('click', () => {
      chrome.tabs.create({ url: "https://github.com/FramedStone/SassyNic/wiki/Timetable-Tool-Tutorial" });
      chrome.tabs.create({ url: "./extension/tutorial-videos/index.html" });
   });

   // Start Extraction
   document.getElementById('btnExtraction').addEventListener('click', () => {
      // send message to background.js to start extraction 
      chrome.runtime.sendMessage({ action: "startExtraction" });
   });

   // Error Code Reference
   document.getElementById('btnErrorCode').addEventListener('click', () => {
      chrome.tabs.create({ url: "https://github.com/FramedStone/SassyNic/wiki/Error-Reference" });
   });

   // Receive message from 'background.js'
   chrome.runtime.onMessage.addListener((message) => {
      if(message.action === "updateTimetableProcessIndicator") {
         updateTimetableProcessIndicator(message.extractingTerm, message.subjectTotal, message.extractingSubject, message.currentIndex);
      }
   })
});

function updateTimetableProcessIndicator(extractingTerm = null, subjectTotal = null, extractingSubject = null, currentIndex = null) {
   document.getElementById('extracting-term-content').textContent = extractingTerm;
   document.getElementById('subject-total-content').textContent = subjectTotal;
   document.getElementById('extracting-subject-content').textContent = `${currentIndex}. ${JSON.stringify(extractingSubject)}`;
}