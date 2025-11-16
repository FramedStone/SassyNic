// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load saved STRM and INSTITUTION values
  chrome.storage.local.get(['STRM', 'INSTITUTION', 'ACAD_CAREER'], function(result) {
    if (result.STRM) {
      document.getElementById('inputSTRM').value = result.STRM;
    }
    if (result.INSTITUTION) {
      const institutionRadio = document.querySelector(`input[name="institution"][value="${result.INSTITUTION}"]`);
      if (institutionRadio) {
        institutionRadio.checked = true;
      }
    }
    if (result.ACAD_CAREER) {
      const acadCareerRadio = document.querySelector(`input[name="acadCareer"][value="${result.ACAD_CAREER}"]`);
      if (acadCareerRadio) {
        acadCareerRadio.checked = true;
      }
    }
  });

  // Save STRM when changed
  document.getElementById('inputSTRM').addEventListener('input', function(e) {
    const strm = e.target.value.trim();
    chrome.storage.local.set({ STRM: strm }, function() {
      console.log('STRM saved:', strm);
    });
  });

  // Save INSTITUTION when changed
  document.querySelectorAll('input[name="institution"]').forEach(function(radio) {
    radio.addEventListener('change', function(e) {
      if (e.target.checked) {
        const institution = e.target.value;
        chrome.storage.local.set({ INSTITUTION: institution }, function() {
          console.log('INSTITUTION saved:', institution);
        });
      }
    });
  });

  // Save ACAD_CAREER when changed
  document.querySelectorAll('input[name="acadCareer"]').forEach(function(radio) {
    radio.addEventListener('change', function(e) {
      if (e.target.checked) {
        const acadCareer = e.target.value;
        chrome.storage.local.set({ ACAD_CAREER: acadCareer }, function() {
          console.log('ACAD_CAREER saved:', acadCareer);
        });
      }
    });
  });

  // ---------------------- USEFUL BUTTONS ----------------------------------------//
  document.getElementById('btnErrorCode').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic/wiki/Error-Reference' });
  });

  document.getElementById('btnWiki').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic/wiki' });
  });

  document.getElementById('btnRoadMap').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/users/FramedStone/projects/2/views/2' });
  });

  document.getElementById('btnFeedback').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://forms.gle/SUsghNXUKW1u1US5A' });
  });

  // ---------------------- TUTORIAL(S) ----------------------------------------//
  // Timetable
  document.getElementById('btnTutorialTimetable').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/FramedStone/SassyNic/wiki/Timetable-Tool-Tutorial',
    });
  });

  // Timetable Tools (Preview)
  document.getElementById('btnTutorialTimetablePreview').addEventListener('click', () => {
    // TODO: tutorial
  });

  // Auto Subjects Grouping (ASG)
  document.getElementById('btnTutorialASG').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/FramedStone/SassyNic/wiki/Auto-Group-Subjects-Grouping-Tutorial',
    });
  });

  // ---------------------- TIMETABLE ----------------------------------------//
  // Start Extraction
  document.getElementById('btnExtraction').addEventListener('click', () => {
    // send message to background.js to start extraction
    chrome.runtime.sendMessage({ action: 'startExtraction' });
  });

  // Start Extraction (Preview)
  document.getElementById('btnExtractionPreview').addEventListener('click', () => {
    // Save enablePreviewExtraction to storage
    chrome.storage.local.set({ enablePreviewExtraction: true }, function() {
      console.log('enablePreviewExtraction set to true');
    });
    
    // send message to background.js to start extraction
    chrome.runtime.sendMessage({ action: 'startExtraction', isPreview: true });
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
    // Update regular timetable indicators
    document.getElementById('extracting-term-content').textContent = extractingTerm;
    document.getElementById('subject-total-content').textContent = subjectTotal;
    document.getElementById('extracting-subject-content').textContent =
      `${currentIndex}. ${JSON.stringify(extractingSubject)}`;

    // Also update preview indicators
    document.getElementById('extracting-term-content-preview').textContent = extractingTerm;
    document.getElementById('subject-total-content-preview').textContent = subjectTotal;
    document.getElementById('extracting-subject-content-preview').textContent =
      `${currentIndex}. ${JSON.stringify(extractingSubject)}`;
  }
});
