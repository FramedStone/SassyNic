import { getActiveTabId, onTabUpdated, getError } from './helpers/utils.js';
import { pruneSchedule } from './helpers/constraints.js';

// Navigate to 'SassyNic' github wiki on installed
// chrome.runtime.onInstalled.addListener(({ reason }) => {
//   if (reason === 'install' || reason === 'update')
//     chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic' });
// });

// -------------------------------------------- extraction.js & auto_enrollment.js -----------------------------------------------------//
chrome.runtime.onMessage.addListener((message) => {
  // Timetable
  if (message.action === 'startExtraction') {
    console.log(message);

    getActiveTabId((tabId) => {
      if (tabId !== null) {
        chrome.tabs.sendMessage(
          tabId,
          {
            action: 'startExtraction_',
            term: message.term,
            index: 0,
            tabId: tabId,
          },
          (response) => {
            if (response && response.status === 'error') {
              getError(response.code);
            }
          }
        );
        console.log('startExtraction_ sent to extraction.js');
      } else {
        console.log('No active tab found!');
      }
    });
  }

  if (message.action === 'selectedCourse') {
    console.log(message);

    onTabUpdated(message.tabId, (tabId) => {
      if (tabId !== null) {
        chrome.tabs.sendMessage(message.tabId, {
          action: 'viewClasses_',
          term: message.term,
          index: message.index,
          tabId: message.tabId,
        });
        console.log('viewClasses sent to extraction.js');

        // Update timetable process indicator content(s)
        chrome.runtime
          .sendMessage({
            action: 'updateTimetableProcessIndicator',
            extractingTerm: message.term,
            subjectTotal: message.subjectTotal,
            extractingSubject: message.extractingSubject,
            currentIndex: message.index + 1,
          })
          .then(() => {
            console.log('updateTimetableIndicator sent to popup.js');
          });
      } else {
        console.log('No active tab found!');
      }
    });
  }

  if (message.action === 'viewClasses') {
    console.log(message);

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: 'MAIN',
        func: () => {
          document.querySelector('div.ps_box-button.psc_primary span a').click();
        },
      })
      .then(() => {
        onTabUpdated(message.tabId, (tabId) => {
          if (tabId !== null) {
            chrome.tabs.sendMessage(
              message.tabId,
              {
                action: 'selectTerm_',
                term: message.term,
                index: message.index,
                tabId: message.tabId,
              },
              (response) => {
                if (response && response.status === 'error') {
                  getError(response.code);
                }
              }
            );
            console.log('selectTerm_ sent to extraction.js');
          } else {
            console.log('No active tab found!');
          }
        });
      });
  }

  if (message.action === 'selectTerm') {
    console.log(message);

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: 'MAIN',
        func: (term) => {
          Array.from(
            document.querySelectorAll(
              'td.ps_grid-cell div.ps_box-group.psc_layout span.ps-link-wrapper a.ps-link'
            )
          )
            .find(
              (el) =>
                el.textContent
                  .trim()
                  .replace(/\s*\/\s*/g, '/')
                  .replace(/(\b\w{3})\w*\s*\/\s*(\b\w{3})\w*/g, '$1/$2')
                  .trim() === term
            )
            .click();
        },
        args: [message.term],
      })
      .then(() => {
        onTabUpdated(message.tabId, (tabId) => {
          if (tabId !== null) {
            chrome.tabs.sendMessage(message.tabId, {
              action: 'extractClassDetails_',
              term: message.term,
              index: message.index,
              tabId: message.tabId,
            });
            console.log('extractClassDetails_ sent to extraction.js');
          } else {
            console.log('No active tab found!');
          }
        });
      });
  }

  if (message.action === 'extractClassDetails') {
    console.log(message);
    const key = 'COURSE_' + message.title;

    // Put dataset into chrome storage with key + message.title
    chrome.storage.local.set({ [key]: message.dataset }, () => {
      console.log('Dataset saved to storage: ', message.title);
      console.log(message.dataset);
    });

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: 'MAIN',
        func: () => {
          window.history.back();
        },
      })
      .then(() => {
        onTabUpdated(message.tabId, (tabId) => {
          if (tabId !== null) {
            chrome.scripting
              .executeScript({
                target: { tabId: message.tabId },
                world: 'MAIN',
                func: () => {
                  const waitForElement = ({ selector, method = 'querySelectorAll' }) => {
                    return new Promise((resolve) => {
                      const observer = new MutationObserver(() => {
                        const elements = document[method](selector);
                        if (elements && (elements.length || elements)) {
                          observer.disconnect(); // Stop observing once the element is found
                          resolve(elements);
                        }
                      });

                      // Observe changes in the entire document
                      observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                      });
                    });
                  };

                  waitForElement({
                    selector: 'div.ps_box-button.psc_primary span a',
                    method: 'querySelector',
                    attributes: {
                      onclick: true,
                    },
                  }).then(() => {
                    window.history.back();
                  });
                },
              })
              .then(() => {
                let index = message.index + 1; // Increment index to move to the next course
                onTabUpdated(message.tabId, (tabId) => {
                  if (tabId !== null) {
                    chrome.tabs.sendMessage(message.tabId, {
                      action: 'startExtraction_',
                      term: message.term,
                      index: index,
                      tabId: message.tabId,
                    });
                    console.log('startExtraction_ sent to extraction.js with index: ', index);
                  } else {
                    console.log('No active tab found!');
                  }
                });
              });
          } else {
            console.log('No active tab found!');
          }
        });
      });
  }

  if (message.action === 'extractionCompleted') {
    /**
     * dataset ->
     */

    chrome.storage.local.get(null, function (items) {
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

// -------------------------------------------- auto_subjects_grouping.js -----------------------------------------------------//
chrome.runtime.onMessage.addListener((message) => {
  // To Selected Term
  if (message.action === 'AGS_Start') {
    console.log(message);

    getActiveTabId((tabId) => {
      if (tabId !== null) {
        chrome.tabs.sendMessage(tabId, { action: 'AGS_Start_', termTo: null, tabId: tabId });
        console.log('AGS_Start_ sent to auto_subjects_grouping.js');
      } else {
        console.log('No active tab found!');
      }
    });
  }

  if (message.action === 'AGS_MoveToTerm') {
    console.log(message);

    onTabUpdated(message.tabId, (tabId) => {
      if (tabId !== null) {
        chrome.tabs.sendMessage(tabId, {
          action: 'AGS_MoveToTerm_',
          termFrom: message.termFrom,
          termTo: message.termTo,
          tabId: tabId,
        });
        console.log('AGS_MoveToTerm_ sent to auto_subjects_grouping.js');
      } else {
        console.log('No active tab found!');
      }
    });
  }

  if (message.action == 'AGS_MoveToTerm_Click') {
    console.log(message);

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: 'MAIN',
        func: (termTo, AGS_Stop) => {
          if (termTo === null) {
            document.querySelector("span[title='Change to Term'] a").click();
          } else {
            const btnMoveToTerm = document.querySelector("span[title='Change to Term'] a");
            if (btnMoveToTerm) {
              btnMoveToTerm.click();
            }

            // Dynamic generated Iframe
            function insertOption() {
              const iframe = document.getElementById('ptModFrame_0');

              if (iframe && iframe.contentWindow) {
                const iframeDocument = iframe.contentWindow.document;

                const options = iframeDocument.querySelectorAll('option');
                options.forEach((option, index) => {
                  // Unassigned case (option = Unassigned, label = Unassigned Courses), for some reason Unassigned !== Unassigned lolllll
                  if (termTo.includes('Unassigned') && option.value === '----') {
                    iframeDocument.querySelector('select').selectedIndex = index;
                  } else if (option.textContent.trim() === termTo) {
                    iframeDocument.querySelector('select').selectedIndex = index;
                  }
                  // Save button
                  iframeDocument.getElementById('DERIVED_SSSPLNR_SSR_PB_GO').click();
                });
              }
            }

            const observer = new MutationObserver((mutationsList, observer) => {
              mutationsList.forEach((mutation) => {
                if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach((addedNode) => {
                    if (addedNode.id === 'ptModFrame_0') {
                      insertOption();
                    }
                  });
                }

                if (mutation.type === 'attributes' && mutation.target.id === 'ptModFrame_0') {
                  insertOption();
                }
              });
            });

            const config = {
              childList: true,
              attributes: true,
              subtree: true,
            };

            console.log(AGS_Stop);
            if (!AGS_Stop) {
              observer.observe(document.body, config);
            } else {
              observer.disconnect();
              alert('done');
            }
          }
        },
        args: [message.termTo, message.AGS_Stop ? true : false],
      })
      .then(() => {
        if (!message.AGS_Stop) {
          chrome.tabs.sendMessage(message.tabId, {
            action: 'AGS_MoveToTerm_Click_',
            termFrom: message.termFrom,
            termTo: message.termTo,
            tabId: message.tabId,
          });
          console.log('AGS_MoveToTerm_Click_ sent to auto_subjects_grouping.js');
        }
      });
  }

  if (message.action === 'AGS_SelectTerm') {
    console.log(message);

    chrome.tabs.sendMessage(message.tabId, {
      action: 'AGS_SelectTerm_',
      termFrom: message.termFrom,
      termTo: message.termTo,
      tabId: message.tabId,
    });
    console.log('AGS_SelectTerm_ sent to auto_subjects_grouping.js');
  }

  if (message.action === 'AGS_SelectSubject') {
    console.log(message);

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: 'MAIN',
        func: (termFrom) => {
          const terms = document.querySelectorAll("td[class='ps_grid-cell TERMS'] a");
          terms.forEach((term) => {
            if (term.textContent.trim() === termFrom) {
              term.click();
            }
          });
        },
        args: [message.termFrom],
      })
      .then(() => {
        onTabUpdated(message.tabId, (tabId) => {
          if (tabId !== null) {
            chrome.tabs.sendMessage(tabId, {
              action: 'AGS_SelectSubject_',
              termFrom: message.termFrom,
              termTo: message.termTo,
              tabId: tabId,
            });
            console.log('AGS_SelectSubject_ sent to auto_subjects_grouping.js');
          } else {
            console.log('No active tab found!');
          }
        });
      });
  }

  if (message.action === 'AGS_SelectedTerm') {
    console.log(message);

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: 'MAIN',
        func: () => {
          // Get selected term
          const termTo = document.getElementById('PANEL_TITLElbl').textContent.trim();

          return termTo;
        },
      })
      .then((termTo) => {
        // It returns as an array with (documentId, frameId, result)
        chrome.tabs.sendMessage(message.tabId, {
          action: 'AGS_Start_',
          termFrom: message.termFrom,
          termTo: termTo[0].result,
          tabId: message.tabId,
        });
        console.log('AGS_Start_ sent to auto_subjects_grouping.js');
      });
  }
});
