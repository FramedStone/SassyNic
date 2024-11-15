document.addEventListener('DOMContentLoaded', function() {
    /**
     * Things to manually adjust every trimester
     * @selectedTrimester
     */
    const selectedTrimester = document.getElementById('trimester').value; 

    // Reset
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
 
      for(let i=0; i<courseTotal; i++) {
        // Planner
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: clickPlanner
        });

        await waitForElement("tr[id^='PLANNER_NFF']", tabId);

        // Trimester/Terms inside Planner
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: selectPlannerTrimester,
          args: [selectedTrimester]
        });

        await waitForElement(`tr[id='PLANNER_ITEMS_NFF$0_row_${i}']`, tabId);

        // Course selection interface
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: selectCourse_,
          args: [i],
        });

        await waitForElement('#DERIVED_SAA_CRS_SSR_PB_GO\\$6\\$', tabId);

        // View Classes
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: clickViewClasses,
        });

        await waitForElementWithText(selectedTrimester, tabId);

        // Trimester
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: selectTrimester,
          args: [selectedTrimester],
        });

        await waitForElement("table.ps_grid-flex[title='Class Options']", tabId);

        // Extract Classes Details
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: extractClassesDetails,
        });
      }
      alert("Extraction Completed.");
      
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
                              return item.hasOwnProperty("courseTitle");
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

    // Dark Mode
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        darkModeToggle.textContent = body.classList.contains('dark-mode') ? '🌙' : '☀️';
    });

    // Expand/Collapse Customization Section
    const toggleCustomizationBtn = document.getElementById('toggleCustomization');
    const customizationSection = document.getElementById('customizationSection');

    toggleCustomizationBtn.addEventListener('click', () => {
        customizationSection.classList.toggle('visible');
        customizationSection.classList.toggle('hidden');
        toggleCustomizationBtn.textContent = customizationSection.classList.contains('visible') 
            ? 'Extract Customization 🔼' 
            : 'Extract Customization 🔽';
    });

    // Enroll Section
    const toggleEnrollBtn = document.getElementById('toggleEnroll');
    const enrollSection = document.getElementById('enrollSection');
    let  inputFieldsContainer = document.getElementById('inputFieldsContainer');

    toggleEnrollBtn.addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      enrollSection.classList.toggle('visible');
      enrollSection.classList.toggle('hidden');
      toggleEnrollBtn.textContent = enrollSection.classList.contains('visible') 
          ? 'Enroll 🔼' 
          : 'Enroll 🔽';

      // Option fields
      if (enrollSection.classList.contains('visible')) {
        try {
          // Request data from the page context
          const keys = await getCourseKeys();
          generateInputFields(keys);
        } catch (error) {
          console.error('Error retrieving course keys:', error);
        }
      } 

      /**
       * Function to get course keys from current domain's 'localStorage' 
       * @returns {Promise<string[]>} - course keys
       */
      async function getCourseKeys() {
        return new Promise((resolve, reject) => {
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length === 0) {
              reject('No active tab found.');
              return;
            }
            const tabId = tabs[0].id;

            chrome.scripting.executeScript(
              {
                target: { tabId: tabId },
                func: () => {
                  // This function runs in the page context
                  function getKeys() {
                    const keys = Object.keys(localStorage);

                    const keys_ = keys.filter(key => {
                      const value = localStorage.getItem(key);

                      try {
                        const parsedValue = JSON.parse(value);

                        return Array.isArray(parsedValue) && parsedValue.every(item => {
                          return item.hasOwnProperty("courseTitle");
                        });
                      } catch (error) {
                        return false;
                      }
                    });

                    return keys_;
                  }

                  return getKeys();
                },
                world: 'MAIN',
              },
              (results) => {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                  reject('Could not get course keys.');
                } else if (results && results[0] && results[0].result) {
                  const keys = results[0].result;
                  resolve(keys);
                } else {
                  reject('No results returned.');
                }
              }
            );
          });
        });
      }

      /**
       * Function to get course codes from current domain's 'localStorage'
       * @returns {Promise<string[]>} - course codes
       */
      async function getCourseCodes() {
        return new Promise((resolve, reject) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
              reject('No active tab found.');
              return;
            }
            const tabId = tabs[0].id;

            chrome.scripting.executeScript(
              {
                target: { tabId: tabId },
                func: () => {
                  // This function runs in the page context
                  function getCourseCodesFromLocalStorage() {
                    const keys = Object.keys(localStorage);
                    const courseCodes = [];

                    keys.forEach((key) => {
                      const value = localStorage.getItem(key);

                      try {
                        const parsedValue = JSON.parse(value);

                        if (
                          Array.isArray(parsedValue) &&
                          parsedValue.every((item) => item.hasOwnProperty('courseTitle'))
                        ) {
                          parsedValue.forEach((item) => {
                            if (item.courseCode && !courseCodes.includes(item.courseCode)) {
                              courseCodes.push(item.courseCode);
                            }
                          });
                        }
                      } catch (error) {
                        // Ignore parsing errors
                      }
                    });

                    return courseCodes;
                  }

                  return getCourseCodesFromLocalStorage();
                },
                world: 'MAIN',
              },
              (results) => {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                  reject('Could not get course codes.');
                } else if (results && results[0] && results[0].result) {
                  const courseCodes = results[0].result;
                  resolve(courseCodes);
                } else {
                  reject('No results returned.');
                }
              }
            );
          });
        });
      }

      /**
       * Function to create input fields based on courses retrieved from 'localStorage'
       * @param {Object} keys - courses from 'localStorage' 
       */
      function generateInputFields(keys) {
        inputFieldsContainer.innerHTML = '';

        keys.forEach((option, index) => {
          // Create a wrapper div for styling purposes (optional)
          const inputWrapper = document.createElement('div');
          inputWrapper.classList.add('input-wrapper');

          // Create the label for the input field
          const label = document.createElement('label');
          label.htmlFor = `inputField${index}`;
          label.textContent = `${option}:`;

          // Create the input field
          const input = document.createElement('input');
          input.type = 'number';
          input.name = `inputField${index}`;
          input.id = `inputField${index}`;
          input.placeholder = 'option'; 

          // Append the label and input to the wrapper
          inputWrapper.appendChild(label);
          inputWrapper.appendChild(input);

          // Append the wrapper to the container
          inputFieldsContainer.appendChild(inputWrapper);
        });
      }

      // Enroll Button
      const btnEnroll = document.getElementById('btnEnroll');
      inputFieldsContainer = Array.from(inputFieldsContainer.querySelectorAll('input')); // get option values from input fields

      btnEnroll.addEventListener('click', async () => {
        const optionValues = getOptionsValues();

        // chrome.scripting.executescript({
        //   target: {tabId: tabId},
        //   world: 'MAIN',
        //   func: startEnroll,
        //   args: [optionValues], 
        // }); 
      }); 

      // Add To Shopping Cart Button
      const btnAddToSC = document.getElementById('btnAddToSC');

      btnAddToSC.addEventListener('click', async () => {
        const optionValues = getOptionsValues();
        const courseTotal = optionValues.length;
        const keys = await getCourseKeys(); // using key's courseCodes to select the correct course (as the order of courses is arbitrary in 'localStorage')
        const courseCodes = await getCourseCodes();

        for(let i=0; i<courseTotal; i++) {
          // Planner
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: clickPlanner
          });

          await waitForElement("tr[id^='PLANNER_NFF']", tabId);

          // Trimester/Terms inside Planner
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: selectPlannerTrimester,
            args: [selectedTrimester]
          });

          await waitForElement(`tr[id='PLANNER_ITEMS_NFF$0_row_${i}']`, tabId);

          // Course selection interface
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: selectCourse,
            args: [courseCodes[i]],
          });

          await waitForElement('#DERIVED_SAA_CRS_SSR_PB_GO\\$6\\$', tabId);

          // View Classes
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: clickViewClasses,
          });

          await waitForElementWithText(selectedTrimester, tabId);

          // Trimester
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: selectTrimester,
            args: [selectedTrimester],
          });

          await waitForElement("table.ps_grid-flex[title='Class Options']", tabId)

          // select class row
          // javascript:OnRowAction(this,'SSR_CLSRCH_F_WK_SSR_OPTION_DESCR$0'); - change the '0' accordingly 
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: selectClassRow, 
            args: [optionValues[i]],
          }); 

          await waitForElement('div.ps_box-button', tabId);

          // next (Enroll / Add to Shopping Cart)
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: clickNext, 
          }); 

          await waitForElement('div.ps_box-control', tabId);

          // select 'Add to Shopping Cart' radio button
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: clickAddToSC, 
          }); 

          // next (step 3 of 3) page
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: clickNext, 
          }); 

          await waitForElement('div.ps_box-button', tabId); 

          // submit 
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: clickSubmit, 
          }); 

          await waitForElement('div.ps_box-button', tabId); 

          // confirm submit
          await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: clickConfirmSubmit,
          });

          await waitForElement("div.psa_tab_SSR_PLNR_TERM_FL", tabId);

        };
      }); 
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
function selectCourse_(index) {
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
 * Function that clicks on the course row based on the 'courseCode' 
 * @param {Array<string>} courseCode 
 */
function selectCourse(courseCode) {
  const row = document.querySelectorAll('tr.ps_grid-row.psc_rowact');

  for(let i=0; i<row.length; i++) {
    const courseName_ = row[i].querySelector('td.ps_grid-cell.COURSE').textContent.trim();
    console.log(courseName_);
    if(courseName_ === courseCode.trim()) {
      const row = document.querySelector(`tr[id='PLANNER_ITEMS_NFF$0_row_${i}']`);
      OnRowAction(row, `SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$${i}`);
      break;
    } else {
      if (!row) {
        console.log(`Course Details row at index ${i} not found`);
      }
      if (typeof OnRowAction !== 'function') {
        console.log('OnRowAction function not found');
      }
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
  const body = table.querySelectorAll('tbody tr:not(.psc_disabled)');
  
  /*
    0: ps_grid-cell OPTION_NSFF
    1: ps_grid-cell (STATUS)
    2: ps_grid-cell SESSION
    3: ps_grid-cell CMPNT_CLASS_NBR (class section)
    4: ps_grid-cell DATES
    5: ps_grid-cell DAYS_TIMES
    6: ps_grid-cell ROOM
    7: ps_grid-cell INSTRUCTOR
    8: ps_grid-cell SEATS
    ps_grid-cell CHEVRON (pop this element)
  */

  const courseTitle = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').textContent;
  const courseCode = document.getElementById('SSR_CRSE_INFO_V_SSS_SUBJ_CATLG').textContent;

  body.forEach(row => {
    const optionBody = row.querySelector('td.ps_grid-cell.OPTION_NSFF');
    const statusBody = row.querySelector('td.ps_grid-cell span.ps_box-value'); // first encounter (STATUS doesn't have unique class naming like others)
    const classBody = row.querySelectorAll('td.ps_grid-cell.CMPNT_CLASS_NBR a.ps-link');

    // filter status 
    if(statusBody.textContent === "Open") {
      const data = {
        courseTitle: courseTitle,
        courseCode: courseCode,
        option: optionBody.textContent.trim(),
        // room: roomBody.textContent.trim(), 
        // instructor: instructorBody.textContent.trim(), 
        class: [], // for holding multiple classes
      }

      classBody.forEach((rowClass, indexClass) => {
        const classData = {
          name: rowClass.textContent,
          daytime: [],
        }

        // insert day and time into class
        const dayTimeBody = row.querySelectorAll('td.ps_grid-cell.DAYS_TIMES div.ps_box-longedit')[indexClass];
        const dayTimeBody_ = dayTimeBody.querySelectorAll('span.ps_box-value');

        dayTimeBody_.forEach(element => {
          const text = element.textContent;

          // split "Day and Times" into "day startMinutes endMinutes"
          const dayMatch = text.match(/^[A-Za-z]+/);
          const day = dayMatch ? dayMatch[0] : "";

          const times = text.slice(day.length).trim();
          const [start, end] = times.split(" to ");
          
          // convert time to minutes (from 12 hours format / 24 hours format)
          const convertToMinutes = (time) => {
            let match;
          
            // Try to match 12-hour format with AM/PM
            match = time.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
            if (match) {
              let hour = parseInt(match[1], 10);
              const minute = parseInt(match[2], 10);
              const period = match[3].toUpperCase();
          
              if (period === "PM" && hour !== 12) hour += 12;
              if (period === "AM" && hour === 12) hour = 0;
          
              return hour * 60 + minute;
            }
          
            // Try to match 24-hour format
            match = time.match(/^(\d{1,2}):(\d{2})$/);
            if (match) {
              const hour = parseInt(match[1], 10);
              const minute = parseInt(match[2], 10);
              return hour * 60 + minute;
            }
          
            // Unable to parse time string
            return 0;
          };
          
          // Convert start and end times to minutes
          const startMinutes = convertToMinutes(start);
          const endMinutes = convertToMinutes(end);

          classData.daytime.push(`${day} ${startMinutes} ${endMinutes}`);
        })

        // insert room into class
        const roomBody = row.querySelectorAll('td.ps_grid-cell.ROOM div.ps_box-edit')[indexClass];
        const roomBody_ = roomBody.querySelectorAll('span.ps_box-value');

        roomBody_.forEach(element => {
          classData.room = element.textContent;
        })

        // insert instructor into class
        const instructorBody = row.querySelectorAll('td.ps_grid-cell.INSTRUCTOR div.ps_box-longedit')[indexClass];
        const instructorBody_ = instructorBody.querySelectorAll('span.ps_box-value');

        instructorBody_.forEach(element => {
          classData.instructor = element.textContent;
        })

        data.class.push(classData);
      })
  
      dataBody.push(data);
    }    
  })
  localStorage.setItem(courseTitle, JSON.stringify(dataBody));

  console.log(courseTitle, ":\n", dataBody);
}

/**
 * function that generate all possible timetable combinations
 * constraints:
 *  - must take one and only one class from each course
 *  - each combinations must not have daytime conflicts
 */
function startGenerate() {
  function getKeys() {
    const keys = Object.keys(localStorage);

    const keys_ = keys.filter(key => {
      const value = localStorage.getItem(key);

      try {
        const parsedValue = JSON.parse(value);

        return Array.isArray(parsedValue) && parsedValue.every(item => {
          return item.hasOwnProperty("courseTitle");
        });
      }catch(error) {
        return false;
      }
    });

    return keys_;
  }

  const keys = getKeys();
  console.log("Courses Included: ", keys);

  const data = [];

  /*
    all possible combintaitons of timetable(without any constraints) = course's options * (course - 1)'s options 

    example: 
      courseTotal = 5
      each course options = c1[1], c2[1,2], c3[1,2,3], c4[1,2,3,4], c5[1,2,3,4,5]
      possible combinations = c1 * c2 * c3 * c4 * c5
                            = 1 * 2 * 3 * 4 * 5
                            = 120 total combinations 
  */

  // load datasets into 'data'
  for(let i=0; i<keys.length; i++) {
    data.push(JSON.parse(localStorage.getItem(keys[i])));
  }

  /**
   * generate all possible combinations by using 'backtrack' algorithm
   * @param {Array} data 
   * @returns {Array} combinations - all possible combinations 
   */
  function startGenerate_(data) {
    const combinations = []; 
      function backtrack(index, currentCombination) { 
        // when reached the end of all the data arrays (after popping all used combinations)  
        if(index === data.length) {
          combinations.push([...currentCombination]);
          return;
        }

        const course = data[index]; // current course array
        for(const class_ of course) {
          // daytime conflict check
          if(!isDaytimeConflict(currentCombination, class_)) {
            currentCombination.push(class_);
            backtrack(index + 1, currentCombination);
            currentCombination.pop(); // pop used combinations
          }
        }
      }

      function isDaytimeConflict(currentCombination, classOption) {
        // check if there's any daytime conflict within the existing combinations
        return currentCombination.some(existingCourse => {            // course
          return existingCourse.class.some(existingClass => {         // class
            return existingClass.daytime.some(existingDayTime => {    // daytime
              // parse existing daytime
              const [day_, strStart_, strEnd_] = existingDayTime.split(" ");
              // convert start and end time to numbers
              const start_ = parseInt(strStart_);
              const end_ = parseInt(strEnd_);
              
              // check with current classOption
              return classOption.class.some(class_ => {              // class
                return class_.daytime.some(daytime_ => {             // daytime
                  // parse new daytime
                  const [day, strStart, strEnd] = daytime_.split(" ");

                  // convert start and end time to numbers
                  const start = parseInt(strStart);
                  const end = parseInt(strEnd);

                  // check if daytime is conflicting
                  if(day_.trim() === day.trim() && (start_ < end && start < end_)) {
                    return true; // break the loop
                  }
                  return false; // continue the loop
                })
              })
            })
          })
        })
      }
        
      backtrack(0,[]); // start the backtracking process from first datasets array 
      return combinations;
  }

  const finalCombinations = startGenerate_(data); 
  console.log(finalCombinations);

  // Create a popup window to display the timetables
  const popupWindow = window.open("", "_blank", "width=1200,height=800,scrollbars=yes");

  // Prepare the HTML content
  let htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Timetable Viewer</title>
    <style>
      :root {
        /* Define CSS variables for background colors */
        --class-cell-bg-color: #d9edf7;    /* Background color for class cells */
        --time-cell-bg-color: #f2f2f2;     /* Background color for time row cells */
        --day-header-bg-color: #f2f2f2;    /* Background color for day header cells */
        --time-filters-header-bg-color: #f2f2f2; /* Background color for time filters header */
      }
      body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
      .timetable {
        border-collapse: collapse;
        width: 100%;
        table-layout: fixed;
      }
      .timetable th, .timetable td {
        border: 1px solid #ccc;
        padding: 0; /* Remove padding */
        text-align: center;
        vertical-align: top;
        width: 14.28%;
        height: 20px; /* Each time slot represents 20 pixels */
        word-wrap: break-word;
        font-size: 12px; /* Reduced font size */
      }
      .timetable th {
        background-color: var(--day-header-bg-color);
        height: auto;
      }
      .time-label {
        background-color: var(--time-cell-bg-color);
        width: 60px;
        text-align: center;
        vertical-align: middle; /* Center the text vertically */
        height: 20px;
      }
      .class-cell {
        background-color: var(--class-cell-bg-color);
        vertical-align: middle;
        text-align: center;
      }
      .class-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center; /* Center the content horizontally */
        height: 100%;
        padding: 2px; /* Reduce padding */
      }
      .class-info > * {
        margin: 1px 0; /* Reduce margin */
      }
      .navigation { margin: 20px 0; text-align: center; }
      .navigation button { padding: 8px 16px; font-size: 14px; margin: 0 5px; }
      .course-list { margin: 20px 0; font-size: 14px; }
      .filters { margin: 20px 0; }
      .filters h3 { margin-bottom: 10px; font-size: 16px; }
      .filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .filter-section {
        flex: 1;
        min-width: 200px;
      }
      #time-filters {
        margin-top: 20px;
      }
      #time-filters table {
        width: 100%;
        border-collapse: collapse;
      }
      #time-filters th, #time-filters td {
        border: 1px solid #ccc;
        padding: 3px;
        text-align: center;
        font-size: 12px;
      }
      #time-filters th {
        background-color: var(--time-filters-header-bg-color);
      }
      /* Ensure each instructor checkbox is on a new line */
      #instructor-checkboxes label {
        display: block;
      }
      /* Style for color pickers */
      .color-picker {
        margin-bottom: 10px;
      }
      /* Bottom section styling */
      .bottom-section {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .customise-colors {
        width: 300px; /* Adjust as needed */
      }
      .all-days-row {
        background-color: #d3d3d3; /* Darker background color */
      }
    </style>
  </head>
  <body>
    <div class="filters">
      <div class="filter-row">
        <div class="filter-section">
          <h3>Exclude Days:</h3>
          <label><input type="checkbox" name="excludeDays" value="Monday"> Monday</label>
          <label><input type="checkbox" name="excludeDays" value="Tuesday"> Tuesday</label>
          <label><input type="checkbox" name="excludeDays" value="Wednesday"> Wednesday</label>
          <label><input type="checkbox" name="excludeDays" value="Thursday"> Thursday</label>
          <label><input type="checkbox" name="excludeDays" value="Friday"> Friday</label>
          <label><input type="checkbox" name="excludeDays" value="Saturday"> Saturday</label>
          <label><input type="checkbox" name="excludeDays" value="Sunday"> Sunday</label>
        </div>
        <div class="filter-section">
          <h3>Exclude Instructors:</h3>
          <div id="instructor-checkboxes">
            <!-- Instructor checkboxes will be populated here -->
          </div>
        </div>
      </div>
      <div id="time-filters">
        <h3>Time Filters:</h3>
        <table>
          <tr>
            <th>Day</th>
            <th>Earliest Start Time</th>
            <th>Latest End Time</th>
          </tr>
          <tr class="all-days-row">
            <td>All Days</td>
            <td><input type="time" id="AllDays-earliest" /></td>
            <td><input type="time" id="AllDays-latest" /></td>
          </tr>
          ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => `
            <tr>
              <td>${day}</td>
              <td><input type="time" id="${day}-earliest" /></td>
              <td><input type="time" id="${day}-latest" /></td>
            </tr>
          `).join('')}
        </table>
      </div>
      <button onclick="applyFilters()">Apply Filters</button>
      <button onclick="resetFilters()">Reset Filters</button>
    </div>
    <div id="timetable-container"></div>
    <div class="navigation">
      <button onclick="prevCombination()">Previous</button>
      <span>
        Combination 
        <input type="number" id="combination-input" value="1" min="1" style="width: 50px;" onchange="goToCombination()" />
        / <span id="total-combinations"></span>
      </span>
      <button onclick="nextCombination()">Next</button>
    </div>
    <div class="course-list" id="course-list"></div>
    <div class="bottom-section">
      <div class="customise-colors">
        <h3>Customise Cells Colors:</h3>
        <div class="color-picker">
          <label for="class-cell-color">Class Cell Color:</label>
          <input type="color" id="class-cell-color" value="#d9edf7">
        </div>
        <div class="color-picker">
          <label for="time-cell-color">Time Cell Color:</label>
          <input type="color" id="time-cell-color" value="#f2f2f2">
        </div>
        <div class="color-picker">
          <label for="day-header-color">Day Header Color:</label>
          <input type="color" id="day-header-color" value="#f2f2f2">
        </div>
      </div>
    </div>
    <script>
      let allCombinations = ${JSON.stringify(finalCombinations)};
      
      // Deduplicate combinations
      allCombinations = Array.from(new Set(allCombinations.map(combo => JSON.stringify(combo)))).map(comboStr => JSON.parse(comboStr));

      let filteredCombinations = allCombinations;
      let currentIndex = 0;

      document.getElementById('total-combinations').innerText = filteredCombinations.length;

      // Variables to store global earliest and latest times
      let globalMinTime = Infinity;
      let globalMaxTime = 0;

      // Variable to store maximum rowspan
      let maxRowspan = 0;

      // Populate instructor checkboxes and calculate global times
      function populateInstructorFilters() {
        const instructorSet = new Set();
        allCombinations.forEach(combination => {
          combination.forEach(course => {
            course.class.forEach(classComponent => {
              instructorSet.add(classComponent.instructor);
              classComponent.daytime.forEach(daytime => {
                const [day, startStr, endStr] = daytime.split(' ');
                const start = parseInt(startStr);
                const end = parseInt(endStr);
                const duration = (end - start) / 30;
                if (duration > maxRowspan) maxRowspan = duration;
                if (start < globalMinTime) globalMinTime = start;
                if (end > globalMaxTime) globalMaxTime = end;
              });
            });
          });
        });
        const instructorCheckboxesDiv = document.getElementById('instructor-checkboxes');
        const instructors = Array.from(instructorSet).sort();
        instructors.forEach(instructor => {
          const label = document.createElement('label');
          label.innerHTML = \`<input type="checkbox" name="instructors" value="\${instructor}"> \${instructor}\`;
          instructorCheckboxesDiv.appendChild(label);
        });
      }

      populateInstructorFilters();

      // Adjust cell height based on maxRowspan
      const baseCellHeight = 600 / ((globalMaxTime - globalMinTime) / 30);
      const adjustedCellHeight = baseCellHeight < 20 ? baseCellHeight : 20;
      document.querySelectorAll('.timetable th, .timetable td').forEach(cell => {
        cell.style.height = adjustedCellHeight + 'px';
      });

      // Round global times to nearest 30 minutes
      globalMinTime = Math.floor(globalMinTime / 30) * 30;
      globalMaxTime = Math.ceil(globalMaxTime / 30) * 30;

      // Add event listeners for color pickers
      document.getElementById('class-cell-color').addEventListener('input', updateColors);
      document.getElementById('time-cell-color').addEventListener('input', updateColors);
      document.getElementById('day-header-color').addEventListener('input', updateColors);

      function updateColors() {
        const classCellColor = document.getElementById('class-cell-color').value;
        const timeCellColor = document.getElementById('time-cell-color').value;
        const dayHeaderColor = document.getElementById('day-header-color').value;

        document.documentElement.style.setProperty('--class-cell-bg-color', classCellColor);
        document.documentElement.style.setProperty('--time-cell-bg-color', timeCellColor);
        document.documentElement.style.setProperty('--day-header-bg-color', dayHeaderColor);
        // Do not change --time-filters-header-bg-color
      }

      function applyFilters() {
        const excludeDaysCheckboxes = document.querySelectorAll('input[name="excludeDays"]:checked');
        const excludeDays = Array.from(excludeDaysCheckboxes).map(cb => cb.value);

        const instructorCheckboxes = document.querySelectorAll('input[name="instructors"]:checked');
        const excludedInstructors = Array.from(instructorCheckboxes).map(cb => cb.value);

        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const timeFilters = {};
        const allDaysEarliest = document.getElementById('AllDays-earliest').value;
        const allDaysLatest = document.getElementById('AllDays-latest').value;

        let allDaysEarliestMinutes, allDaysLatestMinutes;
        if (allDaysEarliest) {
          const [hours, minutes] = allDaysEarliest.split(':').map(Number);
          allDaysEarliestMinutes = hours * 60 + minutes;
        }
        if (allDaysLatest) {
          const [hours, minutes] = allDaysLatest.split(':').map(Number);
          allDaysLatestMinutes = hours * 60 + minutes;
        }

        daysOfWeek.forEach(day => {
          let earliest = document.getElementById(\`\${day}-earliest\`).value;
          let latest = document.getElementById(\`\${day}-latest\`).value;
          if (earliest || latest || allDaysEarliest || allDaysLatest) {
            timeFilters[day] = {};
            if (earliest) {
              const [hours, minutes] = earliest.split(':').map(Number);
              timeFilters[day].earliest = hours * 60 + minutes;
            } else if (allDaysEarliestMinutes !== undefined) {
              timeFilters[day].earliest = allDaysEarliestMinutes;
            }
            if (latest) {
              const [hours, minutes] = latest.split(':').map(Number);
              timeFilters[day].latest = hours * 60 + minutes;
            } else if (allDaysLatestMinutes !== undefined) {
              timeFilters[day].latest = allDaysLatestMinutes;
            }
          }
        });

        filteredCombinations = allCombinations.filter(combination => {
          // Check time filters
          for (const course of combination) {
            for (const classComponent of course.class) {
              for (const daytime of classComponent.daytime) {
                const [day, startStr, endStr] = daytime.split(' ');
                const start = parseInt(startStr);
                const end = parseInt(endStr);

                if (timeFilters[day]) {
                  if (timeFilters[day].earliest !== undefined && start < timeFilters[day].earliest) {
                    return false;
                  }
                  if (timeFilters[day].latest !== undefined && end > timeFilters[day].latest) {
                    return false;
                  }
                }
              }
            }
          }

          // Exclude days and instructors
          for (const course of combination) {
            for (const classComponent of course.class) {
              for (const daytime of classComponent.daytime) {
                const [day, startStr, endStr] = daytime.split(' ');
                if (excludeDays.includes(day)) {
                  return false;
                }
                if (excludedInstructors.includes(classComponent.instructor)) {
                  return false;
                }
              }
            }
          }
          return true;
        });

        currentIndex = 0;
        document.getElementById('total-combinations').innerText = filteredCombinations.length;
        if (filteredCombinations.length > 0) {
          renderCombination(currentIndex);
        } else {
          document.getElementById('timetable-container').innerHTML = '<p>No combinations available with the selected filters.</p>';
          document.getElementById('course-list').innerHTML = '';
        }
      }

      function resetFilters() {
        // Uncheck all exclude days checkboxes
        document.querySelectorAll('input[name="excludeDays"]').forEach(cb => cb.checked = false);

        // Uncheck all instructor checkboxes
        document.querySelectorAll('input[name="instructors"]').forEach(cb => cb.checked = false);

        // Clear all time filters
        ['AllDays', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
          document.getElementById(\`\${day}-earliest\`).value = '';
          document.getElementById(\`\${day}-latest\`).value = '';
        });

        // Reset color pickers to default values
        document.getElementById('class-cell-color').value = '#d9edf7';
        document.getElementById('time-cell-color').value = '#f2f2f2';
        document.getElementById('day-header-color').value = '#f2f2f2';
        updateColors();

        // Re-apply filters (which are now reset)
        applyFilters();
      }

      function formatComponentName(name) {
        let component = '';
        let section = '';
        const componentMatch = name.match(/Component\\s+(\\w+)/);
        if (componentMatch) {
          switch (componentMatch[1]) {
            case 'LAB':
              component = 'Laboratory';
              break;
            case 'TUT':
              component = 'Tutorial';
              break;
            case 'LEC':
              component = 'Lecture';
              break;
            default:
              component = componentMatch[1];
          }
        }
        const sectionMatch = name.match(/Sect\\s+(\\w+)/);
        if (sectionMatch) {
          section = sectionMatch[1];
        }
        return component + ' - ' + section;
      }

      function renderCombination(index) {
        const combination = filteredCombinations[index];
        document.getElementById('combination-input').value = index + 1;
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        // Initialize schedule
        const schedule = {};
        daysOfWeek.forEach(day => {
          schedule[day] = {};
        });

        // Populate schedule with classes
        combination.forEach(course => {
          course.class.forEach(classComponent => {
            classComponent.daytime.forEach(daytime => {
              const [day, startStr, endStr] = daytime.split(' ');
              const start = parseInt(startStr);
              const end = parseInt(endStr);
              const duration = (end - start) / 30; // Number of 30-minute intervals
              if (!schedule[day][start]) {
                schedule[day][start] = {
                  classInfo: {
                    courseTitle: course.courseTitle,
                    componentName: formatComponentName(classComponent.name),
                    instructor: classComponent.instructor,
                    room: classComponent.room,
                    startTimeLabel: formatTime(start),
                    endTimeLabel: formatTime(end),
                    rowspan: duration
                  }
                };
              }
            });
          });
        });

        // Generate time labels
        const timeLabels = [];
        for (let time = globalMinTime; time <= globalMaxTime - 1; time += 30) {
          if (time % 60 === 0) {
            timeLabels.push({ time, label: formatTime(time), isHour: true });
          } else {
            timeLabels.push({ time, label: '', isHour: false });
          }
        }

        let tableHtml = '<table class="timetable">';
        tableHtml += '<tr><th class="time-label">Time</th>';
        daysOfWeek.forEach(day => {
          tableHtml += '<th>' + day + '</th>';
        });
        tableHtml += '</tr>';

        for (let i = 0; i < timeLabels.length; i++) {
          const timeLabel = timeLabels[i];
          tableHtml += '<tr>';
          if (timeLabel.isHour) {
            tableHtml += '<td class="time-label" rowspan="2" style="height:40px;">' + timeLabel.label + '</td>';
          } else if (i === 0 || timeLabels[i - 1].isHour) {
            // Skip adding time label cell
          }
          daysOfWeek.forEach(day => {
            const cellData = schedule[day][timeLabel.time];
            if (cellData && cellData.classInfo) {
              const rowspan = cellData.classInfo.rowspan;
              tableHtml += '<td class="class-cell" rowspan="' + rowspan + '">';
              tableHtml += '<div class="class-info">';
              tableHtml += '<strong>' + cellData.classInfo.courseTitle + '</strong>';
              tableHtml += '<span>' + cellData.classInfo.componentName + '</span>';
              tableHtml += '<span>' + cellData.classInfo.instructor + '</span>';
              tableHtml += '<span>' + cellData.classInfo.room + '</span>';
              tableHtml += '<span>' + cellData.classInfo.startTimeLabel + ' - ' + cellData.classInfo.endTimeLabel + '</span>';
              tableHtml += '</div>';
              tableHtml += '</td>';
            } else if (!isCellRenderedPreviously(schedule, day, timeLabel.time)) {
              tableHtml += '<td></td>';
            }
          });
          tableHtml += '</tr>';
        }

        tableHtml += '</table>';

        document.getElementById('timetable-container').innerHTML = tableHtml;

        let courseListHtml = '<ul>';
        combination.forEach(course => {
          courseListHtml += '<li><strong>' + course.courseTitle + '</strong>, Option: ' + course.option + '</li>';
        });
        courseListHtml += '</ul>';
        document.getElementById('course-list').innerHTML = courseListHtml;
      }

      function isCellRenderedPreviously(schedule, day, time) {
        // Check if there is a class starting before this time that covers this time slot
        for (const classTime in schedule[day]) {
          const classInfo = schedule[day][classTime].classInfo;
          if (classTime < time && (parseInt(classTime) + classInfo.rowspan * 30) > time) {
            return true;
          }
        }
        return false;
      }

      function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        return displayHours + ':' + (mins < 10 ? '0' : '') + mins + ' ' + ampm;
      }

      function prevCombination() {
        if (currentIndex > 0) {
          currentIndex--;
          renderCombination(currentIndex);
        }
      }

      function nextCombination() {
        if (currentIndex < filteredCombinations.length - 1) {
          currentIndex++;
          renderCombination(currentIndex);
        }
      }

      function goToCombination() {
        const input = document.getElementById('combination-input');
        let index = parseInt(input.value) - 1;
        if (index >= 0 && index < filteredCombinations.length) {
          currentIndex = index;
          renderCombination(currentIndex);
        } else {
          alert('Invalid combination number.');
          input.value = currentIndex + 1;
        }
      }

      if (filteredCombinations.length > 0) {
        renderCombination(currentIndex);
      } else {
        document.getElementById('timetable-container').innerHTML = '<p>No combinations available.</p>';
      }
    </script>
  </body>
  </html>
  `;

  // Write the HTML content to the popup window
  popupWindow.document.open();
  popupWindow.document.write(htmlContent);
  popupWindow.document.close();

}

/**
 * Function that will return all the options values in the popup window 
 * @returns {Array} - return all the options values in the popup window
 */
function getOptionsValues() {
  const inputs = inputFieldsContainer.querySelectorAll('input');
  return Array.from(inputs).map(input => input.value);
}

/**
 * Function that will select the class rows based on the option values
 * @param {Array<Number>} optionValues - Array of option values in popup window
 */
function selectClassRow(optionValue) {
  console.log(optionValue);
  OnRowAction(this,`SSR_CLSRCH_F_WK_SSR_OPTION_DESCR$${optionValue}`);
}

/**
 * Function that will click the next button in the page (usually on top right corner)
 */
function clickNext() {
  const nextButton = document.getElementById('PTGP_GPLT_WRK_PTGP_NEXT_PB');
  nextButton.click();
}

/**
 * Function that will click the 'Add to Shopping Cart' button during 'Step 2 of 3'
 */
function clickAddToSC() {
  const btnAddToSC = document.querySelector('input[value="CART"]');
  btnAddToSC.click();
}

/**
 * Function that will click the 'Submit' button during 'Step 3 of 3'
 */
function clickSubmit() {
  const btnSubmit_ = document.querySelector('div.psc_primary');
  const btnSubmit = btnSubmit_.querySelector('a.ps-button');
  btnSubmit.click();
}

function clickConfirmSubmit() {
  const btnConfirmSubmit = document.querySelector('a[id="#ICYes"]');
  btnConfirmSubmit.click();
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
    const checkInterval = document.getElementById('interval').value; // Interval time in milliseconds
    const timeout = document.getElementById('timeout').value; // Timeout duration in milliseconds
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
    const checkInterval = document.getElementById('interval').value; // Interval time in milliseconds
    const timeout = document.getElementById('timeout').value; // Timeout duration in milliseconds
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
      // reject(new Error(`Element with text "${expectedText}" not found within ${timeout}ms`));
      resolve(); // proceed with next process as some of the courses doesn't have this element  (Current: Trimester Selection)
    }, timeout);
  });
}