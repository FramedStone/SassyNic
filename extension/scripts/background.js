import { getActiveTabId, onTabUpdated, getError } from "./helpers/utils.js";
import { pruneSchedule } from "./helpers/constraints.js";

// Navigate to 'SassyNic' github wiki on installed
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install" || reason === "update")
    chrome.tabs.create({ url: "https://github.com/FramedStone/SassyNic" });
});

chrome.runtime.onMessage.addListener((message) => {
  // Auto Login
  if (message.action === "autoLogin") {
    getActiveTabId((active_tab_id) => {
      if (active_tab_id !== null) {
        // Create a new tab and navigate to Outlook.
        chrome.tabs.create({ url: "https://outlook.office.com" }, (new_tab) => {
          let personalAlertShown = false;

          function waitForTenantLogo(tab_id) {
            chrome.scripting.executeScript({
              target: { tabId: tab_id },
              world: "MAIN",
              func: () => {
                return new Promise((resolve) => {
                  // Check if the page URL indicates a personal account.
                  if (window.location.href.includes("https://outlook.live.com/mail/")) {
                    resolve("personal");
                    return;
                  }
                  // Helper to detect the MMU Email
                  const detectMMUEmail = () => {
                    let profileDiv = document.getElementById('O365_MainLink_Me');
                    console.log(profileDiv)
                    if(profileDiv) {
                      profileDiv.click();
                      // Using regex test for string '@student.mmu.edu.my' and '@mmu.edu.my'
                      return /@.*mmu\.edu\.my$/.test(document.getElementById('mectrl_currentAccount_secondary').textContent.trim());
                    } else {
                      return false;
                    }
                  }
                  if (document.readyState === "complete") {
                    if (detectMMUEmail()) {
                      resolve(true);
                    } else {
                      const observer = new MutationObserver((mutations, obs) => {
                        if (detectMMUEmail()) {
                          obs.disconnect();
                          resolve(true);
                        }
                      });
                      observer.observe(document.body, { childList: true, subtree: true });
                    }
                  } else {
                    window.addEventListener("load", () => {
                      setTimeout(() => {
                        if (detectMMUEmail()) {
                          resolve(true);
                        } else {
                          const observer = new MutationObserver((mutations, obs) => {
                            if (detectMMUEmail()) {
                              obs.disconnect();
                              resolve(true);
                            }
                          });
                          observer.observe(document.body, { childList: true, subtree: true });
                        }
                      }, 1000);
                    });
                  }
                });
              }
            }, (results) => {
              if (results && results[0]?.result === true) {
                console.log("MMU MMU email detected");
                extractOTP(tab_id);
              } else if (results && results[0]?.result === "personal") {
                // If a personal account is detected, alert once in the MAIN world.
                if (!personalAlertShown) {
                  chrome.scripting.executeScript({
                    target: { tabId: tab_id },
                    world: "MAIN",
                    func: () => {
                      alert("Kindly login into your MMU outlook account.\n\nNote: Do not close this tab, just sign out and sign in into your MMU account using this tab.");
                    }
                  });
                  personalAlertShown = true;
                }
                console.log("Personal account detected, waiting for next update...");
                onTabUpdated(tab_id, (updated_tab_id) => {
                  waitForTenantLogo(updated_tab_id);
                });
              } else {
                console.log("MMU MMU email not detected, waiting for next update...");
                onTabUpdated(tab_id, (updated_tab_id) => {
                  waitForTenantLogo(updated_tab_id);
                });
              }
            });
          }

          /**
           * Helper function that will extract the 6 digits OTP and delete the mail once it found the same regex pattern within mail
           * @param {String} tab_id 
           */
          function extractOTP(tab_id) {
            chrome.scripting.executeScript({
              target: { tabId: tab_id },
              world: "MAIN",
              func: (timestamp) => {
                console.log("Timestamp from CliC OTP request webpage:", timestamp);
                return new Promise((resolve) => {
                  const observer = new MutationObserver((mutations, obs) => {
                    const spans = document.querySelectorAll("span");
                    spans.forEach((span) => {
                      if (span.innerText.includes(timestamp)) {
                        const otp_match = span.innerText.match(/\b\d{6}\b/);
                        const otp = otp_match ? otp_match[0] : "OTP not found";

                        // Delete the mail
                        const deleteBtn = document.querySelector('button[aria-label="Delete"]');
                        if (deleteBtn) {
                          span.parentElement.click();
                          deleteBtn.click();
                        }

                        obs.disconnect();
                        resolve(otp);
                      }
                    });
                  });
                  observer.observe(document.body, { childList: true, subtree: true });
                });
              },
              args: [message.timestamp]
            }).then((results) => {
              const extracted_otp = results[0]?.result || "OTP not found";
              // Remove outlook tab
              chrome.tabs.remove(tab_id);

              // Insert OTP and validate OTP
              chrome.scripting.executeScript({
                target: { tabId: active_tab_id },
                world: "MAIN",
                func: (otp) => {
                  if (otp === "OTP not found") {
                    alert("2001_OTP_NOT_FOUND");
                    return true;
                  }
                  document.getElementById("otp").value = otp;
                  document.getElementById("ps_submit_button").click();
                },
                args: [extracted_otp]
              });
            }).catch((error) => {
              console.log("OTP error:", error);
              // Remove outlook tab and focus back to CliC tab
              chrome.tabs.remove(tab_id);
              chrome.tabs.update(active_tab_id, { active: true });
              chrome.scripting.executeScript({
                target: { tabId: active_tab_id },
                world: "MAIN",
                func: () => {
                  alert("2001_OTP_NOT_FOUND");
                  return true;
                }
              });
            });
          }

          waitForTenantLogo(new_tab.id);
        });
      } else {
        console.log("No active tab found!");
      }
    });
  }

  // Timetable
  if (message.action === "startExtraction") {
    console.log(message);

    getActiveTabId((tabId) => {
      if (tabId !== null) {
        chrome.tabs.sendMessage(
          tabId,
          {
            action: "startExtraction_",
            term: message.term,
            index: 0,
            tabId: tabId,
          },
          (response) => {
            if (response && response.status === "error") {
              getError(response.code);
            }
          },
        );
        console.log("startExtraction_ sent to extraction.js");
      } else {
        console.log("No active tab found!");
      }
    });
  }

  if (message.action === "selectedCourse") {
    console.log(message);

    onTabUpdated(message.tabId, (tabId) => {
      if (tabId !== null) {
        chrome.tabs.sendMessage(message.tabId, {
          action: "viewClasses_",
          term: message.term,
          index: message.index,
          tabId: message.tabId,
        });
        console.log("viewClasses sent to extraction.js");

        // Update timetable process indicator content(s)
        chrome.runtime.sendMessage({ action: "updateTimetableProcessIndicator", extractingTerm: message.term, subjectTotal: message.subjectTotal, extractingSubject: message.extractingSubject, currentIndex: message.index + 1 }).then(() => {
          console.log("updateTimetableIndicator sent to popup.js");
        })
      } else {
        console.log("No active tab found!");
      }
    });
  }

  if (message.action === "viewClasses") {
    console.log(message);

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: "MAIN",
        func: () => {
          document
            .querySelector("div.ps_box-button.psc_primary span a")
            .click();
        },
      })
      .then(() => {
        onTabUpdated(message.tabId, (tabId) => {
          if (tabId !== null) {
            chrome.tabs.sendMessage(
              message.tabId,
              {
                action: "selectTerm_",
                term: message.term,
                index: message.index,
                tabId: message.tabId,
              },
              (response) => {
                if (response && response.status === "error") {
                  getError(response.code);
                }
              },
            );
            console.log("selectTerm_ sent to extraction.js");
          } else {
            console.log("No active tab found!");
          }
        });
      });
  }

  if (message.action === "selectTerm") {
    console.log(message);

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: "MAIN",
        func: (term) => {
          Array.from(
            document.querySelectorAll(
              "td.ps_grid-cell div.ps_box-group.psc_layout span.ps-link-wrapper a.ps-link",
            ),
          )
            .find((el) => el.textContent.trim().replace(/\s*\/\s*/g, '/')
            .replace(/(\b\w{3})\w*\s*\/\s*(\b\w{3})\w*/g, '$1/$2')
            .trim() === term)
            .click();
        },
        args: [message.term],
      })
      .then(() => {
        onTabUpdated(message.tabId, (tabId) => {
          if (tabId !== null) {
            chrome.tabs.sendMessage(message.tabId, {
              action: "extractClassDetails_",
              term: message.term,
              index: message.index,
              tabId: message.tabId,
            });
            console.log("extractClassDetails_ sent to extraction.js");
          } else {
            console.log("No active tab found!");
          }
        });
      });
  }

  if (message.action === "extractClassDetails") {
    console.log(message);
    const key = 'COURSE_' + message.title;

    // Put dataset into chrome storage with key + message.title 
    chrome.storage.local.set({ [key]: message.dataset }, () => {
      console.log("Dataset saved to storage: ", message.title);
      console.log(message.dataset);
    });

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: "MAIN",
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
                world: "MAIN",
                func: () => {
                  const waitForElement = ({
                    selector,
                    method = "querySelectorAll",
                  }) => {
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
                    selector: "div.ps_box-button.psc_primary span a",
                    method: "querySelector",
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
                      action: "startExtraction_",
                      term: message.term,
                      index: index,
                      tabId: message.tabId,
                    });
                    console.log(
                      "startExtraction_ sent to extraction.js with index: ",
                      index,
                    );
                  } else {
                    console.log("No active tab found!");
                  }
                });
              });
          } else {
            console.log("No active tab found!");
          }
        });
      });
  }

  if (message.action === "extractionCompleted") {
    /**
     * dataset ->
     */

    chrome.storage.local.get(null, function (items) {
      const courseItems = {};
      Object.keys(items).forEach((key) => {
        if (key.startsWith("COURSE_")) {
          courseItems[key] = items[key];
        }
      });

      let dataset = courseItems;
      let pureComb = backtrack_(dataset);
      let prunedComb = backtrack(dataset);
      console.log("Dataset: ", dataset);
      console.log("Pure backtracking result: ", pureComb);
      console.log(
        "Backtracking with daytime conflict + seats availability: ",
        prunedComb,
      );

      // Passing pruned combination to 'timetable.html' in chunks
      chrome.tabs.create(
        { url: chrome.runtime.getURL("extension/timetable/timetable.html") },
        () => {
          chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "timetablejsInjected") {
              sendLargeDataset(prunedComb);
            }
            return true; // keep message port open for receiving message
          });
        },
      );

      /**
       * Function that will split dataset into chunks accordingly
       * @param {Object} prunedComb 
       */
      function sendLargeDataset(prunedComb) {
        const datasetStr = JSON.stringify(prunedComb);
        const chunkSize = 1000000; 
        const totalChunks = Math.ceil(datasetStr.length / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
          const chunk = datasetStr.slice(i * chunkSize, (i + 1) * chunkSize);
          chrome.runtime.sendMessage(
            {
              action: "passDataset",
              chunk: chunk,
              index: i,
              total: totalChunks,
            },
            (response) => {
              console.log(`Chunk ${i} sent with status: ${response?.status}`);
              // Clear chrome storage after the last chunk is sent 
              if (i === totalChunks - 1) {
                chrome.storage.local.get(null, (items) => {
                  Object.keys(items).forEach((key) => {
                    if (key.startsWith("COURSE_")) {
                      chrome.storage.local.remove(key);
                    }
                  });
                  console.log("All keys starting with 'COURSE_' have been cleared.");
                });

              }
            }
          );
        }
      }

    });

    // Pure Backtracking
    function backtrack_(
      data,
      courses = Object.keys(data),
      current = [],
      final = [],
    ) {
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
    function backtrack(
      data,
      courses = Object.keys(data),
      current = [],
      final = [],
    ) {
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
