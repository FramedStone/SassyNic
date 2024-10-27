/**
 * + if found js and element then straight away call the function (await waitForElement("tr[id^='PLANNER_NFF']", tabId);)
 * + trimester selection for users in the popup window before running
 * + kill switch
 * 
 * - iteration based on step 2 (from 'ps_grid-cell COURSES' to get iteration value and just do increment on each iteration at step 3)
 * 
 * - database to store extracted value
 * 
 * - degbugging logs (create error code to refer in another markdown note)
 */

let isTerminated = false; // flag for kill switch

/**
 * Manually edit every semester
 */
const selectedTrimester = "Trimester October/November2024";

document.addEventListener('DOMContentLoaded', function() {
  // Kill switch
  document.getElementById('killSwitchButton').addEventListener('click', () => {
    isTerminated = true; // Set the flag to prevent further actions
    alert("All processes have been terminated."); // Notify the user
  });

  // Web scrap
  document.getElementById('btnExtract').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tabId = tabs[0].id;

    // Course total
    let index = document.getElementById('courseTotal').value;

    for(let i=0; i<index; i++) {
      // Step 1: Trigger 'Planner' using 'MouseEvent'
      await chrome.scripting.executeScript(
        {
          target: {tabId: tabId},
          world: 'MAIN',
          func: clickPlanner,
        }
      );

      // wait for 'Terms' elements to show up
      await waitForElement("tr[id^='PLANNER_NFF']", tabId);
      if (isTerminated) return;

      // Step 2: Trigger 'Trimester' under 'Terms' by calling its 'onClick' JavaScript
      await chrome.scripting.executeScript(
        {
          target: {tabId: tabId},
          world: 'MAIN',
          func: triggerTrimester,
          args: [selectedTrimester]
        }
      );

      /**
       * wait for 'Trimester Course Details' elements to show up
       * @param index_courseTotal - total number of 'Courses'
       */
      await waitForElement(`tr[id='PLANNER_ITEMS_NFF$0_row_${i}']`, tabId);
      if (isTerminated) return;

      // Step 3: Trigger 'Course' details row under 'Terms' by calling its 'onClick' JavaScript
      await chrome.scripting.executeScript(
        {
          target: {tabId: tabId},
          world: 'MAIN',
          func: triggerCourseDetails,
          args: [i],
        }
      );

      // wait for 'View Classes' button element to show up 
      // !! use '\' to correctly specify id !!
      await waitForElement('#DERIVED_SAA_CRS_SSR_PB_GO\\$6\\$', tabId);
      if (isTerminated) return;

      // Step 4: Trigger 'View Classes' using 'MouseEvent'
      await chrome.scripting.executeScript(
        {
          target: {tabId: tabId},
          world: 'MAIN',
          func: clickViewClasses,
        }
      );

      // wait for 'Terms' selection elements to show up with selected 'Trimester'
      await waitForElementWithText(selectedTrimester, tabId);
      if (isTerminated) return;

      // Step 5: Click associated row based on 'selectedTrimester'
      await chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          world: 'MAIN',
          func: clickTrimester,
          args: [selectedTrimester],
        }
      );

      // wait for selected 'Class Section' to show up
      await waitForElement("table.ps_grid-flex[title='Class Options']", tabId);
      if (isTerminated) return;

      // Step 6: Extract Class Options Table
      const tableResults = await chrome.scripting.executeScript(
        {
          target: {tabId: tabId},
          func: extractClassSectionDetails,
        }
      );

      const data = tableResults[0].result;
      renderTable(data);
    }

    alert("Extraction completed.");
  });
});

/**
 * funciton to use 'MouseEvent' to click 'Planner'
 */
function clickPlanner() {
  const liElements = document.querySelectorAll("ul.psa_list-linkmenu li");
  for (let liElement of liElements) {
    const spanText = liElement.querySelector("span.ps-text");
    if (spanText && spanText.textContent.trim() === "Planner") {
      const event = new MouseEvent('click', {bubbles: true, cancelable: true});
      liElement.dispatchEvent(event);
      break;
    }
  }
}

/**
 * function to trigger 'Trimester' section under 'Terms'
 * set index based on total of courses
 */
function triggerTrimester(selectedTrimester) {
  const rows = document.querySelectorAll("tr[id^='PLANNER_NFF']");
  for (let row of rows) {
    const termCell = row.querySelector("td.ps_grid-cell.TERMS a.ps-link");
    if (termCell && termCell.textContent.trim() === selectedTrimester) {
      if (typeof OnRowAction === 'function') {
        OnRowAction(row, 'SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$0');
      }
      break; // Exit loop after the first match is found
    }
  }
}

/**
 * function to render extracted class details back into popup window with table format
 * @param {*} data - extracted class details
 * @returns - table format data back to popup window
 */
function renderTable(data) {
  if (!data) {
    document.getElementById('tableContainer').innerText = 'Table not found.';
    return;
  }
  const tableContainer = document.getElementById('tableContainer');
  tableContainer.innerHTML = '';
  const table = document.createElement('table');
  table.style.width = '100%';
  table.border = '1';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  data.headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  data.rows.forEach((rowData) => {
    const row = document.createElement('tr');
    rowData.forEach((cellData) => {
      const td = document.createElement('td');
      td.textContent = cellData;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  tableContainer.appendChild(table);
}

/**
 * function to trigger selected 'Course Details' by index
 * @param {*} index - total number of 'Course Details'
 */
function triggerCourseDetails(index) {
  const row = document.querySelector(`tr[id='PLANNER_ITEMS_NFF$0_row_${index}']`);
  if (row && typeof OnRowAction === 'function') {
    OnRowAction(row, `SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$${index}`);
  }
}

/**
 * function to use 'MouseEvent' to click 'View Classes' button
 */
function clickViewClasses() {
  const anchor = document.getElementById('DERIVED_SAA_CRS_SSR_PB_GO$6$');
  if (anchor) {
    const event = new MouseEvent('click', {bubbles: true, cancelable: true});
    anchor.dispatchEvent(event);
  }
}

/**
 * Function to click associated trimester's row based on 'selectedTrimester'
 * @param {string} expectedText - The expected text content of the element
 */
function clickTrimester(expectedText) {
  const table = document.querySelector("table.ps_grid-flex[title='Current Terms']");
  if (!table) return;
  const links = table.querySelectorAll('span.ps-link-wrapper a.ps-link');
  for (let link of links) {
    if (link.textContent.trim() === expectedText) {
      link.click();
      break;
    }
  }
}

/**
 * function to extract selected 'Class Section' details
 * @returns - table format back into popup window
 */
function extractClassSectionDetails() {
  const table = document.querySelector("table.ps_grid-flex[title='Class Options']");
  if (!table) return null;
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
        row.push(td.textContent.trim().replace(/\s+/g, ' '));
      }
    });
    data.push(row);
  });
  return { headers: headers, rows: data };
}

/**
 * function to wait for 'new element' to spawn before proceeding
 * @param {*} selector - CSS selector
 * @param {*} tabId - current tabId
 * @returns - return whether selected element has 'spawned'
 */
function waitForElement(selector, tabId) {
  return new Promise((resolve, reject) => {
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
          if (results && results[0] && results[0].result) {
            clearInterval(checkExist);
            resolve();
          }
        }
      );
    }, 500);

    // wait for 10 seconds, return error if element not found
    setTimeout(() => {
      clearInterval(checkExist);
      reject(new Error(`Element ${selector} not found within timeout`));
    }, 10000);
  });
}

/**
 * Function to wait for an element with specific text content to spawn before proceeding
 * @param {string} expectedText - The text content to verify within the target element
 * @param {number} tabId - Current tabId
 * @returns {Promise<void>} - Resolves when the element with the expected text is found
 */
function waitForElementWithText(expectedText, tabId) {
  return new Promise((resolve, reject) => {
    const checkInterval = 500; // Interval time in milliseconds
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
            console.error('Script injection failed:', chrome.runtime.lastError);
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
          console.error('Script injection failed:', chrome.runtime.lastError);
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

