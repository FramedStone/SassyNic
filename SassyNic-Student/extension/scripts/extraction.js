console.log('extraction.js successfully injected');

// Listen messages from 'background.js'
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchTermsFromPage') {
    const url =
      'https://clic.mmu.edu.my/psc/csprd_456/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_CRSE_TERM_FL.GBL';

    fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((htmlResponse) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlResponse, 'text/html');

        const termLinks = doc.querySelectorAll('[id^="SSR_CRS_TERM_WK_SSS_TERM_LINK$"]');
        const terms = Array.from(termLinks).map((link) => ({
          text: link.textContent.trim(),
          id: link.id,
        }));

        sendResponse({ status: 'success', terms: terms });
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        sendResponse({ status: 'error', message: error.message });
      });

    return true;
  }

  if (message.action == 'extractClassDetails_') {
    // Preview mode
    if (message.extractionDataPreview) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(message.extractionDataPreview, 'text/html');
        // Check if there's any class details to extract
        const dataset = extractClassDetails(doc);
        console.log(dataset);

        const subjectTitle = doc
          .getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG')
          .textContent.trim();
        const subjectCode = doc.getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG').textContent.trim();
        chrome.runtime.sendMessage({
          action: 'extractClassDetails',
          term: message.term,
          index: message.index,
          tabId: message.tabId,
          dataset: dataset,
          title: subjectTitle,
          code: subjectCode,
          crseId: message.crseId,
        });
      } catch (error) {
        alert('1003_EXTRACTION_NO_CLASES');
        sendResponse({ status: 'error', code: 1003 });
        return;
      }
    } else {
      // Fallback to original implementation using document
      waitForElement({
        selector: 'TERM_VAL_TBL_DESCR',
        method: 'getElementById',
      }).then(() => {
        let term = document
          .getElementById('TERM_VAL_TBL_DESCR')
          .textContent.replace(/\s*\/\s*/g, '/') // Remove spaces around '/'
          .replace(/(\b\w{3})\w*\s*\/\s*(\b\w{3})\w*/g, '$1/$2') // Keep only first 3 letters of each month
          .replace(/\s\d{4}$/, '')
          .trim();

        // Check if term matching
        if (term === message.term) {
          waitForElement({
            selector: 'table tr td',
            method: 'querySelectorAll',
          }).then(() => {
            // Check if there's any class details to extract
            try {
              const dataset = extractClassDetails();
              console.log(dataset);

              const subjectTitle = document
                .getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG')
                .textContent.trim();
              const subjectCode = document
                .getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG')
                .textContent.trim();
              chrome.runtime.sendMessage({
                action: 'extractClassDetails',
                term: message.term,
                index: message.index,
                tabId: message.tabId,
                dataset: dataset,
                title: subjectTitle,
                code: subjectCode,
              });
            } catch (error) {
              alert('1003_EXTRACTION_NO_CLASES');
              sendResponse({ status: 'error', code: 1003 });
              return;
            }
          });
        } else {
          console.log(message.term);
          console.log(term);
          alert('1001_EXTRACTION_TERM_NOT_MATCHING');
          sendResponse({ status: 'error', code: 1001 });
          return true;
        }
      });
    }
  }
  return true; // Keep message channel open to sendReponse() back to background.js
});

/**
 * Function that extract class details and process extracted data
 * @param {Document} doc - Optional document object (defaults to global document)
 */
function extractClassDetails(doc = document) {
  const rows = doc.querySelectorAll('.ps_grid-row');
  const subjectTitle =
    doc.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG')?.textContent.trim() || '';
  const subjectCode =
    doc.getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG')?.textContent.trim() || '';
  const dataset = { title: subjectTitle, code: subjectCode, class: [] };

  rows.forEach((row) => {
    const class_ = {};
    // Option number
    class_.option = row.querySelector('.OPTION_NSFF a')?.textContent.trim() || '';
    // Status
    class_.status = row.querySelector('td:nth-child(2) .ps_box-value')?.textContent.trim() || '';
    // Session
    class_.session = row.querySelector('.SESSION .ps_box-value')?.textContent.trim() || '';
    // Disabled
    class_.psc_disabled = row.classList.contains('psc_disabled') ? '1' : '0';

    // All parallel arrays
    const classLinks = row.querySelectorAll('.CMPNT_CLASS_NBR a.ps-link');
    const dateSpans = row.querySelectorAll('.DATES .ps_box-value');
    const dayTimeSpans = row.querySelectorAll('.DAYS_TIMES .ps_box-value');
    const roomSpans = row.querySelectorAll('.ROOM .ps_box-value');
    const instructorSpans = row.querySelectorAll('.INSTRUCTOR .ps_box-value');
    const seatSpans = row.querySelectorAll('.SEATS .ps_box-value');

    class_.classes = Array.from(classLinks).map((el, idx) => ({
      classText: el.textContent.trim(),
      dates: dateSpans[idx]?.textContent.trim() || '',
      dayTime: dayTimeSpans[idx]?.innerHTML.trim() || '',
      room: roomSpans[idx]?.textContent.trim() || '',
      instructor: instructorSpans[idx]?.textContent.trim() || 'no_instructor_displayed',
      seats: seatSpans[idx]?.textContent.trim() || '',
      misc: (() => {
        // For compatibility with old structure
        const [day, time] = parseDayAndTime(dayTimeSpans[idx]?.innerHTML.trim() || '');
        return [
          {
            day,
            time,
            room: roomSpans[idx]?.textContent.trim() || '',
            instructor: instructorSpans[idx]?.textContent.trim() || 'no_instructor_displayed',
          },
        ];
      })(),
    }));

    dataset.class.push(class_);
  });

  return dataset;
}

/**
 * Function to split daytime -> [day, time] and convert time into minutes -> "start end"
 * @param {String} daytime - daytime string
 * @returns
 */
function parseDayAndTime(daytime) {
  const parts = daytime.split('<br>');
  const day = parts[0]?.trim();
  const time = parts[1]?.trim();

  // Convert time to "start end" format in minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 'to be announced'; // Checker for 'to be announced' timeslots

    // Split start and end times
    const [startTime, endTime] = timeStr.split(/\s*to\s*/i);

    // Convert individual times to minutes
    const convertSingleTime = (time) => {
      const isPM = time.toUpperCase().includes('PM');
      const isAMPM = /[AP]M/i.test(time); // Check if time uses AM/PM format
      time = time.replace(/[AP]M/i, '').trim();

      let [hours, minutes] = time.split(':').map(Number);

      if (isAMPM) {
        // Handle 12-hour PM conversion
        if (isPM && hours !== 12) {
          hours += 12;
        }
        // Handle midnight (12 AM)
        if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        // For 24-hour format, do nothing special
        if (hours === 24) {
          hours = 0; // Handle edge case for 24:00 as midnight
        }
      }

      return hours * 60 + (minutes || 0);
    };

    const startMinutes = convertSingleTime(startTime);
    const endMinutes = convertSingleTime(endTime);

    return `${startMinutes} ${endMinutes}`;
  };

  return [day, timeToMinutes(time)];
}
