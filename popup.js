/**
 * Things to manually adjust every trimester
 * @selectedTrimester
 */
const selectedTrimester = "Trimester October/November2024";

document.addEventListener('DOMContentLoaded', function() {
    // Reset / Stop
    document.getElementById('btnReset').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      chrome.scripting.executeScript({
        target: {tabId: tabId},
        world: "MAIN",
        func: () => localStorage.clear()
      })
      alert("All processes have been terminated and reset back to default states."); // Notify the user
    });

    // Web Scrap
    document.getElementById('btnExtract').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      let courseTotal = document.getElementById('courseTotal').value;
      if(!courseTotal) alert("Kindly key in how many courses you're taking this trimester.")
 
      // for(let i=0; i<courseTotal; i++) {
      //   // Planner
      //   await chrome.scripting.executeScript({
      //     target: {tabId: tabId},
      //     world: 'MAIN',
      //     func: clickPlanner
      //   });

      //   await waitForElement("tr[id^='PLANNER_NFF']", tabId);

      //   // Trimester/Terms inside Planner
      //   await chrome.scripting.executeScript({
      //     target: {tabId: tabId},
      //     world: 'MAIN',
      //     func: selectPlannerTrimester,
      //     args: [selectedTrimester]
      //   });

      //   await waitForElement(`tr[id='PLANNER_ITEMS_NFF$0_row_${i}']`, tabId);

      //   // Course selection interface
      //   await chrome.scripting.executeScript({
      //     target: {tabId: tabId},
      //     world: 'MAIN',
      //     func: selectCourse,
      //     args: [i],
      //   });

      //   await waitForElement('#DERIVED_SAA_CRS_SSR_PB_GO\\$6\\$', tabId);

      //   // View Classes
      //   await chrome.scripting.executeScript({
      //     target: {tabId: tabId},
      //     world: 'MAIN',
      //     func: clickViewClasses,
      //   });

      //   await waitForElementWithText(selectedTrimester, tabId);

      //   // Trimester
      //   await chrome.scripting.executeScript({
      //     target: {tabId: tabId},
      //     world: 'MAIN',
      //     func: selectTrimester,
      //     args: [selectedTrimester],
      //   });

      //   await waitForElement("table.ps_grid-flex[title='Class Options']", tabId);

        // Extract Classes Details
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: extractClassesDetails,
        });
      // }
      // alert("Extraction Completed.");
      
    });

    // Show Extracted Data
    document.getElementById('btnShowExtracted').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: () => {
            function getKeys() {
              const keys = Object.keys(localStorage);

              const keys_ = keys.filter(key => {
                const value = localStorage.getItem(key);

                try {
                  const parsedValue = JSON.parse(value);

                  return Array.isArray(parsedValue) && parsedValue.every(item => {
                    return item.hasOwnProperty("status") && Array.isArray(item.class) && item.class.every(class_ => {
                      return class_.hasOwnProperty("name") && Array.isArray(class_.daytime);
                    });
                  });
                } catch(error) {
                  return false;
                }
              });

              return keys_;
            }

            const keys = getKeys(); 
            alert(Object.keys(localStorage).length === 0 ? "empty" : keys.join('\n'));

            for(let i=0; i<keys.length; i++) {
              console.log(keys[i], "\n", JSON.parse(localStorage.getItem(keys[i])));
            }
          }
        })
    });

    // Start Generating Timetable Combinations
    document.getElementById('btnGenerate').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: startGenerate
        })
    });
});

/**
 * function that click 'Planner' element using 'MouseEvent'
 */
function clickPlanner() {
  // <ul class="ps_box-scrollarea psa_list-linkmenu psc_list-has-icon psa_vtab" id="win3divSCC_NAV_TAB$0">
  const liElements = document.querySelectorAll("ul.psa_list-linkmenu li");
  let found = false;

  for (let liElement of liElements) {
    // <span class="ps-text">Planner</span>
    const spanText = liElement.querySelector("span.ps-text");
    if (spanText && spanText.textContent.trim() === "Planner") {
      const event = new MouseEvent('click', {bubbles: true, cancelable: true});
      liElement.dispatchEvent(event);
      found = true;
      break;
    }
  }
  if (!found) {
    console.log("Planner element not found");
  }
}

/**
 * function that trigger element's 'onClick' javascript
 * @param {string} selectedTrimester 
 */
function selectPlannerTrimester(selectedTrimester) {
  // <tr class="ps_grid-row psc_rowact" id="PLANNER_NFF$0_row_0" tabindex="0" data-role="button" onclick="javascript:OnRowAction(this,'SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$0');cancelBubble(event);">
  const rows = document.querySelectorAll("tr[id^='PLANNER_NFF']");
  let found = false;
  for (let row of rows) {
    // <td class="ps_grid-cell TERMS">
    const termCell = row.querySelector("td.ps_grid-cell.TERMS a.ps-link");
    if (termCell && termCell.textContent.trim() === selectedTrimester) {
      if (typeof OnRowAction === 'function') {
        OnRowAction(row, 'SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$0');
        found = true;
      } else {
        console.log("OnRowAction function not found");
      }
      break; // Exit loop after the first match is found
    }
  }
  if (!found) {
    console.log(`Trimester "${selectedTrimester}" not found`);
  }
}

/**
 * function that trigger element's 'onClick' javascript
 * @param {number} index 
 */
function selectCourse(index) {
  const row = document.querySelector(`tr[id='PLANNER_ITEMS_NFF$0_row_${index}']`);
  if (row && typeof OnRowAction === 'function') {
    OnRowAction(row, `SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$${index}`);
  } else {
    if (!row) {
      console.log(`Course Details row at index ${index} not found`);
    }
    if (typeof OnRowAction !== 'function') {
      console.log('OnRowAction function not found');
    }
  }
}

/**
 * function that click 'View Classes' element using 'MouseEvent'
*/
function clickViewClasses() {
  const anchor = document.getElementById('DERIVED_SAA_CRS_SSR_PB_GO$6$');
  if (anchor) {
    const event = new MouseEvent('click', {bubbles: true, cancelable: true});
    anchor.dispatchEvent(event);
  } else {
    console.log("View Classes button not found");
  }
}

/**
 * function that click Trimester based on 'selectedTrimester' using 'MouseEvent'
 * @param {string} selectedTrimester 
 */
function selectTrimester(selectedTrimester) {
  const table = document.querySelector("table.ps_grid-flex[title='Current Terms']");
  if (!table) {
    console.log("Current Terms table not found");
  }
  const links = table.querySelectorAll('span.ps-link-wrapper a.ps-link');
  let found = false;
  for (let link of links) {
    if (link.textContent.trim() === selectedTrimester) {
      link.click();
      found = true;
      break;
    }
  }
  if (!found) {
    console.log(`Trimester "${selectedTrimester}" not found in table`);
  }
}

/**
 * function that extract all necessary classes details and store in 'localStorage' with 'Course Names' as keys
 * @returns {object} combinedData
 */
function extractClassesDetails() {
  // <table class="ps_grid-flex" title="Class Options">
  const table = document.querySelector("table.ps_grid-flex[title='Class Options']");
  if(!table) {
    console.log("Class Options table not found.");
  }

  var dataBody = [];
  const body = table.querySelectorAll('tbody tr');
  
  /*
    0: ps_grid-cell OPTION_NSFF
    1: ps_grid-cell (STATUS)
    2: ps_grid-cell SESSION
    3: ps_grid-cell CMPNT_CLASS_NBR
    4: ps_grid-cell DATES
    5: ps_grid-cell DAYS_TIMES
    6: ps_grid-cell ROOM
    7: ps_grid-cell INSTRUCTOR
    8: ps_grid-cell SEATS
    ps_grid-cell CHEVRON (pop this element)
  */

  body.forEach(row => {
    const statusBody = row.querySelector('td.ps_grid-cell span.ps_box-value'); // first encounter (STATUS doesn't have unique class naming like others)
    const classBody = row.querySelectorAll('td.ps_grid-cell.CMPNT_CLASS_NBR a.ps-link');

    // filter status 
    if(statusBody.textContent === "Open") {
      const data = {
        // courseTitle: courseTitle,
        class: [], // for holding multiple classes
      }

      // insert day and time into class
      classBody.forEach((rowClass, indexClass) => {
        const classData = {
          name: rowClass.textContent,
          daytime: []
        }

        const dayTimeBody = row.querySelectorAll('td.ps_grid-cell.DAYS_TIMES div.ps_box-longedit')[indexClass];
        const dayTimeBody_ = dayTimeBody.querySelectorAll('span.ps_box-value')
        dayTimeBody_.forEach(element => {
          const text = element.textContent;

          // split "Day and Times" into "day startMinutes endMinutes"
          const dayMatch = text.match(/^[A-Za-z]+/);
          const day = dayMatch ? dayMatch[0] : "";

          const times = text.slice(day.length).trim();
          const [start, end] = times.split(" to ");
          
          // convert time from 12hour format > 24hour format > minutes
          const convertToMinutes = (time) => {
            const match = time.match(/(\d+):(\d+)(AM|PM)/);
            if (!match) return 0;
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const period = match[3];
            
            if (period === "PM" && hour !== 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;
            
            return hour * 60 + minute;
          };
          
          // Convert start and end times to minutes
          const startMinutes = convertToMinutes(start);
          const endMinutes = convertToMinutes(end);

          classData.daytime.push(`${day} ${startMinutes} ${endMinutes}`);
        })

        data.class.push(classData);
      })
  
      dataBody.push(data);
    }    
  })
  const courseTitle = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').textContent;
  localStorage.setItem(courseTitle, JSON.stringify(dataBody));

  console.log(courseTitle, ":\n", dataBody);
}

function startGenerate() {
  function getKeys() {
    const keys = Object.keys(localStorage);

    const keys_ = keys.filter(key => {
      const value = localStorage.getItem(key);

      try {
        const parsedValue = JSON.parse(value);

        return Array.isArray(parsedValue) && parsedValue.every(item => {
          return item.hasOwnProperty("status") && Array.isArray(item.class) && item.class.every(class_ => {
            return class_.hasOwnProperty("name") && Array.isArray(class_.daytime);
          });
        });
      }catch(error) {
        return false;
      }
    });

    return keys_;
  }

  const keys = getKeys();
  console.log("Courses Included: ", keys.length);

  const data = [], combinations = [];
  const setUsed = new Set(), rowUsed = new Set();

  for(let i=0; i<keys.length; i++) {
    data.push(JSON.parse(localStorage.getItem(keys[i])));

    if(!setUsed.has(data[i])) {
      setUsed.add(data[i]);

      data[i].forEach(element => {
        if(!rowUsed.has(element)) {
          rowUsed.add(element);

        }
      })
    }
  }
  console.log(setUsed)
}

/**
 * Function to wait for 'new element' to spawn before proceeding
 * @param {*} selector - CSS selector
 * @param {*} tabId - current tabId
 * @returns - return whether selected element has 'spawned'
*/
function waitForElement(selector, tabId) {
  console.log(`waitForElement: Waiting for element ${selector}`);
  return new Promise((resolve, reject) => {
    const checkInterval = 2000; // Interval time in milliseconds
    const timeout = 10000; // Timeout duration in milliseconds
    const checkExist = setInterval(() => {
      chrome.scripting.executeScript(
        {
          target: {tabId: tabId},
          func: (selector) => {
            return document.querySelector(selector) !== null;
          },
          args: [selector],
        },
        (results) => {
          if (chrome.runtime.lastError) {
            clearInterval(checkExist);
            reject(new Error('Script injection failed.'));
            return;
          }
          if (results && results[0] && results[0].result) {
            clearInterval(checkExist);
            resolve();
          }
        }
      );
    }, checkInterval);

    // wait for 10 seconds, return error if element not found
    setTimeout(() => {
      clearInterval(checkExist);
      reject(new Error(`Element ${selector} not found within timeout`));
    }, timeout);
  });
}

/**
 * Function to wait for an element with specific text content to spawn before proceeding
 * @param {string} expectedText - The text content to verify within the target element
 * @param {number} tabId - Current tabId
 * @returns {Promise<void>} - Resolves when the element with the expected text is found
*/
function waitForElementWithText(expectedText, tabId) {
  console.log(`waitForElementWithText: Waiting for text "${expectedText}"`);
  return new Promise((resolve, reject) => {
    const checkInterval = 1000; // Interval time in milliseconds
    const timeout = 10000; // Timeout duration in milliseconds
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: (expectedText) => {
            const elements = document.querySelectorAll('*');
            for (let el of elements) {
              if (el.textContent.trim() === expectedText) {
                return true;
              }
            }
            return false;
          },
          args: [expectedText],
        },
        (results) => {
          if (chrome.runtime.lastError) {
            clearInterval(intervalId);
            reject(new Error('Script injection failed.'));
            return;
          }

          const found = results && results[0] && results[0].result;
          if (found) {
            clearInterval(intervalId);
            resolve();
          } else if (Date.now() - startTime >= timeout) {
            clearInterval(intervalId);
            reject(new Error(`Element with text "${expectedText}" not found within timeout`));
          }
        }
      );
    }, checkInterval);

    // Perform an initial check immediately
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: (expectedText) => {
          const elements = document.querySelectorAll('*');
          for (let el of elements) {
            if (el.textContent.trim() === expectedText) {
              return true;
            }
          }
          return false;
        },
        args: [expectedText],
      },
      (results) => {
        if (chrome.runtime.lastError) {
          clearInterval(intervalId);
          reject(new Error('Script injection failed.'));
          return;
        }

        const found = results && results[0] && results[0].result;
        if (found) {
          clearInterval(intervalId);
          resolve();
        }
      }
    );

    // Timeout handling
    setTimeout(() => {
      clearInterval(intervalId);
      reject(new Error(`Element with text "${expectedText}" not found within ${timeout}ms`));
    }, timeout);
  });
}