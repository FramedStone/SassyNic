/**
 * Things to manually adjust every trimester
 * @selectedTrimester
 */
const selectedTrimester = "Trimester Oct/Nov 2024";

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
    3: ps_grid-cell CMPNT_CLASS_NBR (class section)
    4: ps_grid-cell DATES
    5: ps_grid-cell DAYS_TIMES
    6: ps_grid-cell ROOM
    7: ps_grid-cell INSTRUCTOR
    8: ps_grid-cell SEATS
    ps_grid-cell CHEVRON (pop this element)
  */

  const courseTitle = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').textContent;

  body.forEach(row => {
    const optionBody = row.querySelector('td.ps_grid-cell.OPTION_NSFF');
    const statusBody = row.querySelector('td.ps_grid-cell span.ps_box-value'); // first encounter (STATUS doesn't have unique class naming like others)
    const classBody = row.querySelectorAll('td.ps_grid-cell.CMPNT_CLASS_NBR a.ps-link');
    const roomBody = row.querySelector('td.ps_grid-cell.ROOM');
    const instructorBody = row.querySelector('td.ps_grid-cell.INSTRUCTOR');

    // filter status 
    if(statusBody.textContent === "Open") {
      const data = {
        courseTitle: courseTitle,
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
  
  // Create a popup window to display the timetables
  const popupWindow = window.open("", "_blank", "width=1200,height=800,scrollbars=yes");

  // Prepare the HTML content
  let htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Timetable Combinations</title>
    <style>
      body { font-family: Arial, sans-serif; }
      .timetable { border-collapse: collapse; width: 100%; }
      .timetable th, .timetable td { border: 1px solid #ccc; padding: 5px; text-align: center; }
      .timetable th { background-color: #f2f2f2; }
      .class-cell { background-color: #d9edf7; }
      .navigation { margin: 20px 0; text-align: center; }
      .navigation button { padding: 10px 20px; font-size: 16px; }
      .course-list { margin: 20px 0; }
      .filters { margin: 20px 0; }
      .filters h2 { margin-bottom: 10px; }
      .filters label { display: block; margin: 5px 0; }
      .filters input[type="checkbox"] { margin-right: 5px; }
    </style>
  </head>
  <body>
    <h1>Timetable Combinations</h1>
    <div class="filters">
      <h2>Filters:</h2>
      <div>
        <h3>Exclude Days with Classes:</h3>
        <label><input type="checkbox" name="excludeDays" value="Monday"> Monday</label>
        <label><input type="checkbox" name="excludeDays" value="Tuesday"> Tuesday</label>
        <label><input type="checkbox" name="excludeDays" value="Wednesday"> Wednesday</label>
        <label><input type="checkbox" name="excludeDays" value="Thursday"> Thursday</label>
        <label><input type="checkbox" name="excludeDays" value="Friday"> Friday</label>
        <label><input type="checkbox" name="excludeDays" value="Saturday"> Saturday</label>
        <label><input type="checkbox" name="excludeDays" value="Sunday"> Sunday</label>
      </div>
      <button onclick="applyFilters()">Apply Filters</button>
    </div>
    <div id="timetable-container"></div>
    <div class="navigation">
      <button onclick="prevCombination()">Previous</button>
      <span>
        Combination 
        <input type="number" id="combination-input" value="1" min="1" style="width: 60px;" onchange="goToCombination()" />
        / <span id="total-combinations"></span>
      </span>
      <button onclick="nextCombination()">Next</button>
    </div>
    <div class="course-list" id="course-list"></div>
    <script>
      // Retrieve final combinations
      const allCombinations = ${JSON.stringify(finalCombinations)};
      let filteredCombinations = allCombinations;
      let currentIndex = 0;

      document.getElementById('total-combinations').innerText = filteredCombinations.length;

      function applyFilters() {
        // Get selected days to exclude
        const excludeDaysCheckboxes = document.querySelectorAll('input[name="excludeDays"]:checked');
        const excludeDays = Array.from(excludeDaysCheckboxes).map(cb => cb.value);

        // Filter combinations
        filteredCombinations = allCombinations.filter(combination => {
          // Check each class in the combination
          for (const course of combination) {
            for (const classComponent of course.class) {
              for (const daytime of classComponent.daytime) {
                const [day, startStr, endStr] = daytime.split(' ');
                // Exclude days check
                if (excludeDays.includes(day)) {
                  return false;
                }
              }
            }
          }
          // If all classes pass the filters, include the combination
          return true;
        });

        // Reset current index and total combinations
        currentIndex = 0;
        document.getElementById('total-combinations').innerText = filteredCombinations.length;
        if (filteredCombinations.length > 0) {
          renderCombination(currentIndex);
        } else {
          document.getElementById('timetable-container').innerHTML = '<p>No combinations available with the selected filters.</p>';
          document.getElementById('course-list').innerHTML = '';
        }
      }

      function renderCombination(index) {
        const combination = filteredCombinations[index];
        document.getElementById('combination-input').value = index + 1;
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const timeSlots = [];

        // Collect all time slots
        combination.forEach(course => {
          course.class.forEach(classComponent => {
            classComponent.daytime.forEach(daytime => {
              const [day, startStr, endStr] = daytime.split(' ');
              const start = parseInt(startStr);
              const end = parseInt(endStr);
              const duration = (end - start) / 60; // Number of 60-minute intervals
              timeSlots.push({ 
                day, 
                start, 
                end, 
                duration, 
                courseTitle: course.courseTitle, 
                componentName: classComponent.name 
              });
            });
          });
        });

        // Determine the earliest and latest times
        const times = timeSlots.flatMap(slot => [slot.start, slot.end]);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        // Generate time labels (e.g., 8:00 AM, 9:00 AM, etc.)
        const timeLabels = [];
        for (let time = minTime; time <= maxTime; time += 60) {
          const hours = Math.floor(time / 60);
          const minutes = time % 60;
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 === 0 ? 12 : hours % 12;
          const timeLabel = displayHours + ':' + (minutes < 10 ? '0' : '') + minutes + ' ' + ampm;
          timeLabels.push({ time, label: timeLabel });
        }

        // Create a mapping of day and time to classes, with rowspan information
        const schedule = {};
        daysOfWeek.forEach(day => {
          schedule[day] = {};
          timeLabels.forEach(timeLabel => {
            schedule[day][timeLabel.time] = { classInfo: null, display: true };
          });
        });

        // Populate the schedule with classes and calculate rowspan
        timeSlots.forEach(slot => {
          const startTimeIndex = timeLabels.findIndex(tl => tl.time === slot.start);
          const endTimeIndex = timeLabels.findIndex(tl => tl.time === slot.end);
          const rowspan = (slot.end - slot.start) / 60; // Number of 60-minute intervals

          // Set class info for the starting time slot
          if (schedule[slot.day]) {
            schedule[slot.day][slot.start] = {
              classInfo: {
                courseTitle: slot.courseTitle,
                componentName: slot.componentName,
                rowspan: rowspan
              },
              display: true
            };
            // Mark subsequent time slots to skip display (they will be covered by rowspan)
            for (let time = slot.start + 60; time < slot.end; time += 60) {
              schedule[slot.day][time] = { classInfo: null, display: false };
            }
          }
        });

        // Build the HTML table
        let tableHtml = '<table class="timetable">';
        // Table header
        tableHtml += '<tr><th>Time</th>';
        daysOfWeek.forEach(day => {
          tableHtml += '<th>' + day + '</th>';
        });
        tableHtml += '</tr>';

        // Table rows
        timeLabels.forEach(timeLabel => {
          tableHtml += '<tr>';
          tableHtml += '<td>' + timeLabel.label + '</td>';
          daysOfWeek.forEach(day => {
            const cellData = schedule[day][timeLabel.time];
            if (cellData.display) {
              if (cellData.classInfo) {
                tableHtml += '<td class="class-cell" rowspan="' + cellData.classInfo.rowspan + '">' + 
                  cellData.classInfo.courseTitle + '<br>' + cellData.classInfo.componentName + '</td>';
              } else {
                tableHtml += '<td></td>';
              }
            }
            // If display is false, we do not render a cell for that time slot and day.
          });
          tableHtml += '</tr>';
        });

        tableHtml += '</table>';

        // Display the table
        document.getElementById('timetable-container').innerHTML = tableHtml;

        // Display the list of courses and options
        let courseListHtml = '<h2>Courses in Combination ' + (index + 1) + ':</h2><ul>';
        combination.forEach(course => {
          courseListHtml += '<li><strong>' + course.courseTitle + '</strong>, Option: ' + course.option + '</li>';
        });
        courseListHtml += '</ul>';
        document.getElementById('course-list').innerHTML = courseListHtml;
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

      // Initial render
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