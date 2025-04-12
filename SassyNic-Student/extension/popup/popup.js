// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function () {
  // ---------------------- ERROR CODE REFERENCE ----------------------------------------//
  // Error Code Reference
  document.getElementById('btnErrorCode').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic/wiki/Error-Reference' });
  });

  // ---------------------- TUTORIAL(S) ----------------------------------------//
  // Timetable
  document.getElementById('btnTutorialTimetable').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/FramedStone/SassyNic/wiki/Timetable-Tool-Tutorial',
    });
  });

  // TODO: Auto Subjects Grouping (ASG)
  document.getElementById('btnTutorialASG').addEventListener('click', () => {
    // chrome.tabs.create({ url: "https://github.com/FramedStone/SassyNic/wiki/Timetable-Tool-Tutorial" });
  });

  // ---------------------- TIMETABLE ----------------------------------------//
  // Start Extraction
  document.getElementById('btnExtraction').addEventListener('click', () => {
    // send message to background.js to start extraction
    chrome.runtime.sendMessage({ action: 'startExtraction' });
  });

  // Receive message from 'background.js'
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateTimetableProcessIndicator') {
      updateTimetableProcessIndicator(
        message.extractingTerm,
        message.subjectTotal,
        message.extractingSubject,
        message.currentIndex
      );
    }
  });

  // ---------------------- AUTO SUBJECTS GROUPING (ASG) ----------------------------------------//
  // To 'Selected Term'
  document.getElementById('btnToSelected').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'AGS_Start' });
  });
});

/**
 * Function that will update popup window's timetable process indicator accordingly
 * @param {String} extractingTerm
 * @param {String} subjectTotal
 * @param {String} extractingSubject
 * @param {String} currentIndex - Current Subject's index
 */
function updateTimetableProcessIndicator(
  extractingTerm = null,
  subjectTotal = null,
  extractingSubject = null,
  currentIndex = null
) {
  document.getElementById('extracting-term-content').textContent = extractingTerm;
  document.getElementById('subject-total-content').textContent = subjectTotal;
  document.getElementById('extracting-subject-content').textContent =
    `${currentIndex}. ${JSON.stringify(extractingSubject)}`;
}
