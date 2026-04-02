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

// -------------------------------------------- auto_enrollment.js -----------------------------------------------------//
// Enrollment state tracker
let enrollmentState = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Start enrollment process
  if (message.action === 'startEnrollment') {
    console.log('Starting enrollment:', message.type, message.combination);

    enrollmentState = {
      type: message.type,
      combination: message.combination,
      currentIndex: 0,
      peopleSoftTabId: null,
      timetableTabId: message.timetableTabId,
      term: null, // Will be extracted during flow
    };

    // Find the PeopleSoft tab
    chrome.tabs.query({ url: 'https://clic.mmu.edu.my/ps*/csprd*/*EMPLOYEE*' }, (tabs) => {
      if (tabs.length > 0) {
        enrollmentState.peopleSoftTabId = tabs[0].id;
        // Activate the PeopleSoft tab
        chrome.tabs.update(tabs[0].id, { active: true });
        // Start enrollment flow for first course
        processEnrollmentCourse();
      } else {
        chrome.tabs.sendMessage(message.timetableTabId, {
          action: 'enrollmentError',
          message: 'No PeopleSoft tab found. Please open the course planner first.',
        });
      }
    });
    return true;
  }

  // Course selected (matched by title+code)
  if (message.action === 'enrollCourseSelected') {
    console.log('Course selected:', message.foundIndex);

    onTabUpdated(message.tabId, (tabId) => {
      if (tabId !== null) {
        chrome.tabs.sendMessage(tabId, {
          action: 'enrollViewClasses_',
          tabId: tabId,
        });
        console.log('enrollViewClasses_ sent to auto_enrollment.js');
      }
    });
    return true;
  }

  // View classes button ready
  if (message.action === 'enrollViewClassesReady') {
    console.log('View classes ready, clicking...');

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
            chrome.tabs.sendMessage(tabId, {
              action: 'enrollSelectTerm_',
              term: enrollmentState.term,
              tabId: tabId,
            });
            console.log('enrollSelectTerm_ sent to auto_enrollment.js');
          }
        });
      });
    return true;
  }

  // Term selection needed (Promise.race winner: term links found)
  if (message.action === 'enrollTermSelected') {
    console.log('Term selection needed, clicking term...');

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
        args: [enrollmentState.term],
      })
      .then(() => {
        onTabUpdated(message.tabId, (tabId) => {
          if (tabId !== null) {
            // After clicking term, navigate back twice
            navigateBackTwice(message.tabId);
          }
        });
      });
    return true;
  }

  // Already on class details page (Promise.race winner: TERM_VAL_TBL_DESCR found)
  if (message.action === 'enrollTermReady') {
    console.log('Already on class details page, navigating back...');

    // Navigate back twice
    navigateBackTwice(message.tabId);
    return true;
  }

  // Course not found - abort enrollment
  if (message.action === 'enrollmentCourseNotFound') {
    const courseInfo = enrollmentState.combination[enrollmentState.currentIndex];
    chrome.tabs.sendMessage(enrollmentState.timetableTabId, {
      action: 'enrollmentError',
      message: `Course "${courseInfo.title}" (${courseInfo.code}) not found. Please enroll manually by following the option of each course provided.`,
    });
    enrollmentState = null;
    return true;
  }

  // Term not matching - abort enrollment
  if (message.action === 'enrollmentTermNotMatching') {
    chrome.tabs.sendMessage(enrollmentState.timetableTabId, {
      action: 'enrollmentError',
      message:
        'Term not matching. Please enroll manually by following the option of each course provided.',
    });
    enrollmentState = null;
    return true;
  }
});

/**
 * Process enrollment for current course in the combination
 */
function processEnrollmentCourse() {
  if (!enrollmentState) return;

  const course = enrollmentState.combination[enrollmentState.currentIndex];
  console.log(
    `Processing course ${enrollmentState.currentIndex + 1}/${enrollmentState.combination.length}:`,
    course.title,
    course.code
  );

  // Extract term from first course
  if (enrollmentState.currentIndex === 0) {
    // Get term from the PeopleSoft page
    chrome.scripting
      .executeScript({
        target: { tabId: enrollmentState.peopleSoftTabId },
        world: 'MAIN',
        func: () => {
          const termEl = document.querySelector('span.ps-text[id="PANEL_TITLElbl"]');
          return termEl
            ? termEl.textContent
                .replace(/\s*\/\s*/g, '/')
                .replace(/(\b\w{3})\w*\s*\/\s*(\b\w{3})\w*/g, '$1/$2')
                .trim()
            : null;
        },
      })
      .then((result) => {
        if (result && result[0] && result[0].result) {
          enrollmentState.term = result[0].result;
          console.log('Extracted term:', enrollmentState.term);
          sendEnrollSelectCourse();
        } else {
          chrome.tabs.sendMessage(enrollmentState.timetableTabId, {
            action: 'enrollmentError',
            message: 'Could not extract term from PeopleSoft page.',
          });
          enrollmentState = null;
        }
      });
  } else {
    sendEnrollSelectCourse();
  }
}

/**
 * Send enrollSelectCourse_ message to auto_enrollment.js
 */
function sendEnrollSelectCourse() {
  const course = enrollmentState.combination[enrollmentState.currentIndex];

  chrome.tabs.sendMessage(
    enrollmentState.peopleSoftTabId,
    {
      action: 'enrollSelectCourse_',
      courseTitle: course.title,
      courseCode: course.code,
      tabId: enrollmentState.peopleSoftTabId,
    },
    (response) => {
      if (response && response.status === 'error') {
        console.error('Error selecting course:', response);
      }
    }
  );
  console.log('enrollSelectCourse_ sent to auto_enrollment.js');
}

/**
 * Navigate back twice to return to course planner
 * Mirrors the exact pattern from the extraction flow (lines 158-223)
 */
function navigateBackTwice(tabId) {
  // First back: from class details page → view classes page
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
        window.history.back();
      },
    })
    .then(() => {
      onTabUpdated(tabId, () => {
        // Second back: wait for "View Classes" button to appear, then go back to course planner
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            world: 'MAIN',
            func: () => {
              const waitForElement = ({ selector, method = 'querySelectorAll' }) => {
                return new Promise((resolve) => {
                  const observer = new MutationObserver(() => {
                    const elements = document[method](selector);
                    if (elements && (elements.length || elements)) {
                      observer.disconnect();
                      resolve(elements);
                    }
                  });
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
            onTabUpdated(tabId, () => {
              // Move to next course directly (no message relay needed)
              enrollmentState.currentIndex++;

              if (enrollmentState.currentIndex < enrollmentState.combination.length) {
                console.log(
                  `Moving to course ${enrollmentState.currentIndex + 1}/${enrollmentState.combination.length}`
                );
                processEnrollmentCourse();
              } else {
                // All courses enrolled
                chrome.tabs.sendMessage(enrollmentState.timetableTabId, {
                  action: 'enrollmentCompleted',
                  type: enrollmentState.type,
                });
                enrollmentState = null;
              }
            });
          });
      });
    });
}
