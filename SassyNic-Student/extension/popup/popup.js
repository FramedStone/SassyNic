// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   // Timetable
   // Tutorial
   document.getElementById('btnTutorial').addEventListener('click', () => {
      chrome.tabs.create({ url: "https://github.com/FramedStone/SassyNic/wiki/Timetable-Tool-Tutorial" });
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

/**
 * Function that will update popup window's timetable process indicator accordingly
 * @param {String} extractingTerm 
 * @param {String} subjectTotal 
 * @param {String} extractingSubject 
 * @param {String} currentIndex - Current Subject's index
 */
function updateTimetableProcessIndicator(extractingTerm = null, subjectTotal = null, extractingSubject = null, currentIndex = null) {
   document.getElementById('extracting-term-content').textContent = extractingTerm;
   document.getElementById('subject-total-content').textContent = subjectTotal;
   document.getElementById('extracting-subject-content').textContent = `${currentIndex}. ${JSON.stringify(extractingSubject)}`;
}