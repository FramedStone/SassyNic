  // Global Variables
  let isTerminated = false; // flag for kill switch

  /**
   * Manually edit every semester
   */
  const selectedTrimester = "Trimester October/November2024";

  document.addEventListener('DOMContentLoaded', function() {
    // Reset / Stop
    document.getElementById('btnReset').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      isTerminated = true; // Set the flag to prevent further actions
      chrome.scripting.executeScript({
        target: {tabId: tabId},
        world: 'MAIN',
        func: () => localStorage.clear()
      })
      alert("All processes have been terminated and reset back to default states."); // Notify the user
    });

    // Web scrap
    document.getElementById('btnExtract').addEventListener('click', async () => {
      try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const tabId = tabs[0].id;

        // Course total
        let index = document.getElementById('courseTotal').value;

        for(let i=0; i<index; i++) {
          console.log(`Iteration ${i+1} of ${index}`);

          // Step 1: Trigger 'Planner' using 'MouseEvent'
          console.log('Executing clickPlanner');
          const plannerResults = await chrome.scripting.executeScript(
            {
              target: {tabId: tabId},
              world: 'MAIN',
              func: clickPlanner,
            }
          );
          const plannerResult = plannerResults[0].result;
          if (plannerResult.status === 'error') {
            throw new Error(`Error in clickPlanner: ${plannerResult.message}`);
          }

          // wait for 'Terms' elements to show up
          console.log('Waiting for Terms elements to load');
          await waitForElement("tr[id^='PLANNER_NFF']", tabId);
          if (isTerminated) return;

          // Step 2: Trigger 'Trimester' under 'Terms' by calling its 'onClick' JavaScript
          console.log('Executing triggerTrimester');
          const trimesterResults = await chrome.scripting.executeScript(
            {
              target: {tabId: tabId},
              world: 'MAIN',
              func: triggerTrimester,
              args: [selectedTrimester]
            }
          );
          const trimesterResult = trimesterResults[0].result;
          if (trimesterResult.status === 'error') {
            throw new Error(`Error in triggerTrimester: ${trimesterResult.message}`);
          }

          // wait for 'Trimester Course Details' elements to show up
          console.log('Waiting for Trimester Course Details to load');
          await waitForElement(`tr[id='PLANNER_ITEMS_NFF$0_row_${i}']`, tabId);
          if (isTerminated) return;

          // Step 3: Trigger 'Course' details row under 'Terms' by calling its 'onClick' JavaScript
          console.log('Executing triggerCourseDetails');
          const courseDetailsResults = await chrome.scripting.executeScript(
            {
              target: {tabId: tabId},
              world: 'MAIN',
              func: triggerCourseDetails,
              args: [i],
            }
          );
          const courseDetailsResult = courseDetailsResults[0].result;
          if (courseDetailsResult.status === 'error') {
            throw new Error(`Error in triggerCourseDetails: ${courseDetailsResult.message}`);
          }

          // wait for 'View Classes' button element to show up 
          console.log('Waiting for View Classes button to load');
          await waitForElement('#DERIVED_SAA_CRS_SSR_PB_GO\\$6\\$', tabId);
          if (isTerminated) return;

          // Step 4: Trigger 'View Classes' using 'MouseEvent'
          console.log('Executing clickViewClasses');
          const viewClassesResults = await chrome.scripting.executeScript(
            {
              target: {tabId: tabId},
              world: 'MAIN',
              func: clickViewClasses,
            }
          );
          const viewClassesResult = viewClassesResults[0].result;
          if (viewClassesResult.status === 'error') {
            throw new Error(`Error in clickViewClasses: ${viewClassesResult.message}`);
          }

          // wait for 'Terms' selection elements to show up with selected 'Trimester'
          console.log('Waiting for Terms selection to load');
          await waitForElementWithText(selectedTrimester, tabId);
          if (isTerminated) return;

          // Step 5: Click associated row based on 'selectedTrimester'
          console.log('Executing clickTrimester');
          const clickTrimesterResults = await chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              world: 'MAIN',
              func: clickTrimester,
              args: [selectedTrimester],
            }
          );

          /**
           * !! need more debugging, sometimes it return error although the function ran successfully !!
           */
          // const clickTrimesterResult = clickTrimesterResults[0].result;
          // if (clickTrimesterResult.status === 'error') {
          //   throw new Error(`Error in clickTrimester: ${clickTrimesterResult.message}`);
          // }

          // wait for selected 'Class Section' to show up
          console.log('Waiting for Class Section to load');
          await waitForElement("table.ps_grid-flex[title='Class Options']", tabId);
          if (isTerminated) return;

          // Step 6: Extract Class Options Table + Render
          console.log('Executing extractClassSectionDetails');
          const tableResults = await chrome.scripting.executeScript(
            {
              target: {tabId: tabId},
              func: extractClassSectionDetails,
              args: [i],
            }
          );
          const tableResult = tableResults[0].result;
          if (tableResult.status === 'error') {
            throw new Error(`Error in extractClassSectionDetails: ${tableResult.message}`);
          }
        }
        alert("Extraction completed.");
      } catch (error) {
        console.error('Error during extraction:', error.message);
        alert(`Error during extraction: ${error.message}`);
      }
    });

    // Show Extracted Data
    document.getElementById('btnShowExtracted').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      await chrome.scripting.executeScript(
        {
          target: {tabId: tabId},
          world: 'MAIN',
          func: () => alert(Object.keys(localStorage) == 0 ? "empty" : Object.keys(localStorage).join('\n')),
        }
      )
    });

    // Generate Timetable Combinations
    document.getElementById('btnGenerate').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const tabId = tabs[0].id;

      try {
        chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: startGenerate,
        })
      }catch(error) {
        console.log(error);
      }
    });
  });

  /**
   * Function to use 'MouseEvent' to click 'Planner'
   */
  function clickPlanner() {
    try {
      console.log('clickPlanner: Starting');
      const liElements = document.querySelectorAll("ul.psa_list-linkmenu li");
      let found = false;
      for (let liElement of liElements) {
        const spanText = liElement.querySelector("span.ps-text");
        if (spanText && spanText.textContent.trim() === "Planner") {
          const event = new MouseEvent('click', {bubbles: true, cancelable: true});
          liElement.dispatchEvent(event);
          found = true;
          console.log('clickPlanner: Planner clicked');
          break;
        }
      }
      if (!found) {
        throw new Error("Planner element not found");
      }
      return {status: 'success'};
    } catch (error) {
      console.error('Error in clickPlanner:', error.message);
      return {status: 'error', message: error.message};
    }
  }

  /**
   * Function to trigger 'Trimester' section under 'Terms'
   */
  function triggerTrimester(selectedTrimester) {
    try {
      console.log('triggerTrimester: Starting');
      const rows = document.querySelectorAll("tr[id^='PLANNER_NFF']");
      let found = false;
      for (let row of rows) {
        const termCell = row.querySelector("td.ps_grid-cell.TERMS a.ps-link");
        if (termCell && termCell.textContent.trim() === selectedTrimester) {
          if (typeof OnRowAction === 'function') {
            OnRowAction(row, 'SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$0');
            found = true;
            console.log('triggerTrimester: Trimester triggered');
          } else {
            throw new Error("OnRowAction function not found");
          }
          break; // Exit loop after the first match is found
        }
      }
      if (!found) {
        throw new Error(`Trimester "${selectedTrimester}" not found`);
      }
      return {status: 'success'};
    } catch (error) {
      console.error('Error in triggerTrimester:', error.message);
      return {status: 'error', message: error.message};
    }
  }

  /**
   * Function to trigger selected 'Course Details' by index
   * @param {*} index - index of the 'Course Details'
   */
  function triggerCourseDetails(index) {
    try {
      console.log(`triggerCourseDetails: Starting for index ${index}`);
      const row = document.querySelector(`tr[id='PLANNER_ITEMS_NFF$0_row_${index}']`);
      if (row && typeof OnRowAction === 'function') {
        OnRowAction(row, `SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$${index}`);
        console.log('triggerCourseDetails: Course details triggered');
        return {status: 'success'};
      } else {
        if (!row) {
          throw new Error(`Course Details row at index ${index} not found`);
        }
        if (typeof OnRowAction !== 'function') {
          throw new Error('OnRowAction function not found');
        }
      }
    } catch (error) {
      console.error('Error in triggerCourseDetails:', error.message);
      return {status: 'error', message: error.message};
    }
  }

  /**
   * Function to use 'MouseEvent' to click 'View Classes' button
   */
  function clickViewClasses() {
    try {
      console.log('clickViewClasses: Starting');
      const anchor = document.getElementById('DERIVED_SAA_CRS_SSR_PB_GO$6$');
      if (anchor) {
        const event = new MouseEvent('click', {bubbles: true, cancelable: true});
        anchor.dispatchEvent(event);
        console.log('clickViewClasses: View Classes clicked');
        return {status: 'success'};
      } else {
        throw new Error("View Classes button not found");
      }
    } catch (error) {
      console.error('Error in clickViewClasses:', error.message);
      return {status: 'error', message: error.message};
    }
  }

  /**
   * Function to click associated trimester's row based on 'selectedTrimester'
   * @param {string} expectedText - The expected text content of the element
   */
  function clickTrimester(expectedText) {
    try {
      console.log('clickTrimester: Starting');
      const table = document.querySelector("table.ps_grid-flex[title='Current Terms']");
      if (!table) {
        throw new Error("Current Terms table not found");
      }
      const links = table.querySelectorAll('span.ps-link-wrapper a.ps-link');
      let found = false;
      for (let link of links) {
        if (link.textContent.trim() === expectedText) {
          link.click();
          found = true;
          console.log('clickTrimester: Trimester clicked');
          break;
        }
      }
      if (!found) {
        throw new Error(`Trimester "${expectedText}" not found in table`);
      }
      return {status: 'success'};
    } catch (error) {
      console.error('Error in clickTrimester:', error.message);
      return {status: 'error', message: error.message};
    }
  }

  /**
   * Function to extract selected 'Class Section' details
   * @returns - table format back into popup window
   */
  function extractClassSectionDetails(i) {
    try {
      console.log('extractClassSectionDetails: Starting');
      const table = document.querySelector("table.ps_grid-flex[title='Class Options']");
      if (!table) {
        throw new Error("Class Options table not found");
      }
      const headers = [];
      table.querySelectorAll('thead th').forEach((th, index, arr) => {
        if (index < arr.length - 1) {
          headers.push(th.textContent.trim());
        }
      });
      const data = [];
      table.querySelectorAll('tbody tr').forEach((tr) => {
        const row = [];
        const cells = tr.querySelectorAll('td');
        cells.forEach((td, index) => {
          if (index < cells.length - 1) {
            row.push(td.textContent.trim().replace(/\s+/g, ' ')); // standardlise data by replacing characters
          }
        });
        data.push(row);
      });
      console.log('extractClassSectionDetails: Data extracted successfully\n\n', 'headers:', headers, '\n\ndata:', data);

      // Combine headers and data into one object
      const combinedData = { headers: headers, data: data };
      console.log('\n\nCombined Serialised data:\n', combinedData);

      // stringify data before storing as 'localStorage' only accepts 'string'
      const courseName = document.getElementById('SSR_CRSE_INFO_V_COURSE_TITLE_LONG').innerText; 
      localStorage.setItem(courseName, JSON.stringify(combinedData)); // using 'course name' as key
      
      return {status: 'success'};
    } catch (error) {
      console.error('Error in extractClassSectionDetails:', error.message);
      return {status: 'error', message: error.message};
    }
  }

  function startGenerate() {
    /**
     * Filter out 'status' and reorganise 'Days and Times'
     */
  
    // Retrieve all keys from localStorage
    const keys = Object.keys(localStorage);
    console.log(`keys: ${keys}`);
  
    for (let i = 0; i < keys.length; i++) {
      // Parse the stored JSON data
      const data = JSON.parse(localStorage.getItem(keys[i]));
  
      // Find the index of 'Status' and 'Seats' columns
      const indexStatus = data.headers.indexOf("Status");
  
      // Filter 'Status' = 'Open'
      const dataFiltered = data.data.filter(row => row[indexStatus] === "Open");
  
      // Remap back into Object
      data.data = dataFiltered;
  
      /**
       * Converts a time string from 12hours format > 24hours format > minutes
       * @param {string} timeStr - Time string in format "h:mmAM/PM"
       * @returns {number} - time in minutes
       */
      function convertTimeToMinutes(timeStr) {
        const timeRegex = /(\d{1,2}):(\d{2})(AM|PM)/i;
        const match = timeStr.match(timeRegex);
        if (!match) return null;
  
        let [_, hour, minute, period] = match;
        hour = parseInt(hour, 10);
        minute = parseInt(minute, 10);
  
        // Convert from '12hours' format into '24hours' format
        if (period.toUpperCase() === "PM" && hour !== 12) { hour += 12; }
        if (period.toUpperCase() === "AM" && hour === 12) { hour = 0; }
  
        return hour * 60 + minute; // Convert into minutes
      }
  
      /**
       * Splits the "Days and Times" string into an array of { day, start, end } objects.
       * @param {string} daysTimesStr - "Days and Times" string
       * @returns {Array} - Array of objects: { day: "Wednesday", startTime: 960, endTime: 1020 }
       */
      function parseDaysAndTimes(daysTimesStr) {
        const dayTimesPairs = [];
        // Create a regex pattern to match day names followed by their time ranges
        const dayPattern = daysOfWeek.join("|");
        const regex = new RegExp(`(${dayPattern})\\s*(\\d{1,2}:\\d{2}(?:AM|PM))\\s*to\\s*(\\d{1,2}:\\d{2}(?:AM|PM))`, "gi");
        let match;
  
        while ((match = regex.exec(daysTimesStr)) !== null) {
          const day = match[1].trim();
          const startTimeStr = match[2].trim();
          const endTimeStr = match[3].trim();
  
          const startTime = convertTimeToMinutes(startTimeStr);
          const endTime = convertTimeToMinutes(endTimeStr);
  
          if (startTime !== null && endTime !== null) {
            dayTimesPairs.push({
              day,
              startTime,
              endTime
            });
          } else {
            console.warn(`Unable to parse times for day: ${day} in "${daysTimesStr}"`);
          }
        }
  
        return dayTimesPairs;
      }
  
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
      const daysTimesIndex = data.headers.indexOf("Days and Times");
  
      // Update headers by replacing "Days and Times" with "Days" and "ClassTimes"
      const newHeaders = data.headers.map(header => {
        if (header === "Days and Times") {
          return ["Days", "ClassTimes"]; // Renamed "Times" to "ClassTimes"
        }
        return header;
      }).flat();
  
      // Process each data row
      const processedData = data.data.map(row => {
        // Clone the row to avoid mutating the original data array
        const newRow = [...row];
  
        const daysTimesStr = row[daysTimesIndex];
        const parsedDaysTimes = parseDaysAndTimes(daysTimesStr);
  
        // Extract Days and ClassTimes
        const days = parsedDaysTimes.map(dt => dt.day);
        const classTimes = parsedDaysTimes.map(dt => ({
          start: dt.startTime,
          end: dt.endTime
        }));
  
        // Replace the "Days and Times" field with "Days" and "ClassTimes"
        newRow.splice(daysTimesIndex, 1, days, classTimes);
  
        return newRow;
      });
  
      // Log processedData result
      console.log(`\n${keys[i]} Transformed Data:`);
      processedData.forEach((row) => {
        console.log(`\n`);
        newHeaders.forEach((header, i) => {
          console.log(`${header}: ${JSON.stringify(row[i])}`);
        });
      });
  
      // localStorage.clear();
    }
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
              console.log(`waitForElement: Element ${selector} found`);
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
              console.log(`waitForElementWithText: Text "${expectedText}" found`);
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
            console.log(`waitForElementWithText: Text "${expectedText}" found`);
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