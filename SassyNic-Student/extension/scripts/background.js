import { getActiveTabId, onTabUpdated, getError } from './helpers/utils.js';
import { pruneSchedule } from './helpers/constraints.js';

// Navigate to 'SassyNic' github wiki on installed
// chrome.runtime.onInstalled.addListener(({ reason }) => {
//   if (reason === 'install' || reason === 'update')
//     chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic' });
// });

// -------------------------------------------- WebRequest Listeners -----------------------------------------------------//
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log(details);
  },
  {
    urls: ['*://*.mmu.edu.my/*'],
    types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
  }
);

// -------------------------------------------- extraction.js & auto_enrollment.js -----------------------------------------------------//
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'extractionCompleted') {
    /**
     * dataset ->
     */

    // Clear processedCourses Set
    processedCourses.clear();

    // Clear currentIndex and disable preview extraction
    chrome.storage.local.set(
      {
        currentIndex: 0,
        enablePreviewExtraction: false,
      },
      function() {
        console.log('Cleared currentIndex and disabled preview extraction');
      }
    );

    chrome.storage.local.get(null, function(items) {
      const courseItems = {};
      Object.keys(items).forEach((key) => {
        if (key.startsWith('COURSE_')) {
          courseItems[key] = items[key];
        }
      });

      let dataset = courseItems;
      let pureComb = backtrack_(dataset);
      let prunedComb = backtrack(dataset);
      console.log('Dataset: ', dataset);
      console.log('Pure backtracking result: ', pureComb);
      console.log('Backtracking with daytime conflict + seats availability: ', prunedComb);

      // Passing pruned combination to 'timetable.html' in chunks
      const extractedTerm = message.term;

      chrome.tabs.create(
        { url: chrome.runtime.getURL('extension/timetable/timetable.html') },
        (newTab) => {
          const tabId = newTab.id;
          const listener = (msg, sender, sendResponse) => {
            if (msg.action === 'timetablejsInjected' && sender.tab?.id === tabId) {
              sendLargeDataset(prunedComb, tabId, extractedTerm);
              chrome.runtime.onMessage.removeListener(listener);
            }
            return true;
          };
          chrome.runtime.onMessage.addListener(listener);
        }
      );

      /**
       * Function that will split dataset into chunks accordingly
       * @param {Object} prunedComb
       */
      function sendLargeDataset(prunedComb, targetTabId, term) {
        let datasetStr = JSON.stringify(prunedComb);
        const chunkSize = 1000000;
        const totalChunks = Math.ceil(datasetStr.length / chunkSize);
        let chunksAcknowledged = 0;

        for (let i = 0; i < totalChunks; i++) {
          const chunk = datasetStr.slice(i * chunkSize, (i + 1) * chunkSize);
          chrome.tabs.sendMessage(
            targetTabId,
            {
              action: 'passDataset',
              chunk: chunk,
              index: i,
              total: totalChunks,
              term: term,
            },
            (response) => {
              console.log(`Chunk ${i} sent with status: ${response?.status}`);
              chunksAcknowledged++;

              // Clear all data after last chunk confirmation
              if (chunksAcknowledged === totalChunks) {
                // Clear chrome.storage
                chrome.storage.local.get(null, (items) => {
                  Object.keys(items).forEach((key) => {
                    if (key.startsWith('COURSE_')) {
                      chrome.storage.local.remove(key);
                    }
                  });
                  console.log('Cleared all COURSE_ keys from storage');

                  // Clear caches
                  caches
                    .keys()
                    .then((cacheNames) => {
                      return Promise.all(
                        cacheNames.map((cacheName) => {
                          if (cacheName.includes('timetable')) {
                            console.log(`Clearing cache: ${cacheName}`);
                            return caches.delete(cacheName);
                          }
                        })
                      );
                    })
                    .then(() => {
                      console.log('All timetable caches cleared');

                      // Release memory references
                      prunedComb = null;
                      datasetStr = null;
                      console.log('Memory references cleared');
                    });
                });
              }
            }
          );
        }
      }
    });

    // Pure Backtracking
    function backtrack_(data, courses = Object.keys(data), current = [], final = []) {
      // Exit factor
      if (current.length === courses.length) {
        final.push([...current]);
        return;
      }

      const course = courses[current.length];
      const options = data[course].class;
      const title = data[course].title;
      const code = data[course].code;

      for (let option of options) {
        current.push({ title: title, code: code, option });
        backtrack_(data, courses, current, final, title);
        current.pop(); // Backtrack
      }

      return final;
    }

    // Backtracking with daytime conflict, seats availability contraints
    function backtrack(data, courses = Object.keys(data), current = [], final = []) {
      // Exit factor
      if (current.length === courses.length) {
        if (!pruneSchedule(current)) {
          final.push([...current]);
        }
        return;
      }

      const course = courses[current.length];
      const options = data[course].class;
      const title = data[course].title;
      const code = data[course].code;

      for (let option of options) {
        current.push({ title, code, option });
        backtrack(data, courses, current, final);
        current.pop(); // Backtrack
      }

      return final;
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchTerms') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchTermsFromPage' }, (response) => {
          sendResponse(response);
        });
      } else {
        sendResponse({ status: 'error', message: 'No active tab found' });
      }
    });
    return true;
  }

  if (message.action === 'termsExtracted') {
    return true;
  }
});
