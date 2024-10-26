/**
 * 1. fix step 5 logic (find correct semester, maybe create an input in popup window for user to input before starting?)
 * 2. iteration based on step 2 (from 'ps_grid-cell COURSES' to get iteration value and just do increment on each iteration at step 3)
 */

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('executeAllButton').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tabId = tabs[0].id;

    try {
      for (let i = 0; i < 6; i++) {
        // Step 1: Trigger Additional OnClick
        await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            world: 'MAIN',
            func: triggerAdditionalOnClick,
          }
        );

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Trigger Row OnClick
        await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            world: 'MAIN',
            func: triggerRowOnClick,
          }
        );

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Trigger OnClick and Show Status
        await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            world: 'MAIN',
            func: triggerOnClick,
            args: [i],
          }
        );

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Get the updated status
        const statusResults = await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            func: getStatus,
          }
        );

        const status = statusResults[0].result;
        document.getElementById('tableContainer').innerText = status;

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 5: Trigger Span OnClick
        await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            world: 'MAIN',
            func: triggerSpanOnClick,
          }
        );

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 6: Trigger New Span OnClick
        await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            world: 'MAIN',
            func: triggerNewSpanOnClick,
          }
        );

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 7: Extract Class Options Table
        const tableResults = await chrome.scripting.executeScript(
          {
            target: {tabId: tabId},
            func: extractClassOptionsTable,
          }
        );

        const data = tableResults[0].result;
        renderTable(data);

        // Wait for 2 seconds before next iteration
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(error);
      document.getElementById('tableContainer').innerText = 'An error occurred: ' + error.message;
    }
  });
});

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

function triggerOnClick(index) {
  const row = document.querySelector(`tr[id='PLANNER_ITEMS_NFF$0_row_${index}']`);
  if (row && typeof OnRowAction === 'function') {
    OnRowAction(row, `SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$${index}`);
  }
}

function getStatus() {
  const statusDiv = document.querySelector("#win4divSTATUS$0 .ps_box-htmlarea .ps-htmlarea");
  if (!statusDiv) {
    return 'Status not found.';
  } else {
    return statusDiv.innerText.trim();
  }
}

function triggerSpanOnClick() {
  const anchor = document.getElementById('DERIVED_SAA_CRS_SSR_PB_GO$6$');
  if (anchor) {
    anchor.click();
  }
}

function triggerNewSpanOnClick() {
  const anchor = document.getElementById('SSR_CRS_TERM_WK_SSS_TERM_LINK$17$$0');
  if (anchor) {
    anchor.click();
  }
}

function extractClassOptionsTable() {
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

function triggerAdditionalOnClick() {
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

function triggerRowOnClick() {
  const row = document.querySelector("tr[id^='PLANNER_NFF']");
  if (row && typeof OnRowAction === 'function') {
    OnRowAction(row, 'SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$0');
  }
}
