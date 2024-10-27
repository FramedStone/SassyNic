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
        const clickTrimesterResult = clickTrimesterResults[0].result;
        if (clickTrimesterResult.status === 'error') {
          throw new Error(`Error in clickTrimester: ${clickTrimesterResult.message}`);
        }

        // wait for selected 'Class Section' to show up
        console.log('Waiting for Class Section to load');
        await waitForElement("table.ps_grid-flex[title='Class Options']", tabId);
        if (isTerminated) return;

        // Step 6: Extract Class Options Table
        console.log('Executing extractClassSectionDetails');
        const tableResults = await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            func: extractClassSectionDetails,
          }
        );
        const tableResult = tableResults[0].result;
        if (tableResult.status === 'error') {
          throw new Error(`Error in extractClassSectionDetails: ${tableResult.message}`);
        }
        const data = { headers: tableResult.headers, rows: tableResult.rows };
        console.log('Rendering extracted data');
        renderTable(data);
      }

      alert("Extraction completed.");
    } catch (error) {
      console.error('Error during extraction:', error.message);
      alert(`Error during extraction: ${error.message}`);
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
 * Function to render extracted class details back into popup window with table format
 * @param {*} data - extracted class details
 * @returns - table format data back to popup window
 */
function renderTable(data) {
  try {
    console.log('renderTable: Starting');
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
    console.log('renderTable: Table rendered successfully');
  } catch (error) {
    console.error('Error in renderTable:', error.message);
    document.getElementById('tableContainer').innerText = `Error rendering table: ${error.message}`;
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
function extractClassSectionDetails() {
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
          row.push(td.textContent.trim().replace(/\s+/g, ' '));
        }
      });
      data.push(row);
    });
    console.log('extractClassSectionDetails: Data extracted successfully');
    return {status: 'success', headers: headers, rows: data };
  } catch (error) {
    console.error('Error in extractClassSectionDetails:', error.message);
    return {status: 'error', message: error.message};
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
  console.log(`waitForElementWithText: Waiting for text "${expectedText}"`);
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
