document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("triggerButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          world: "MAIN",
          func: triggerOnClick,
        },
        () => {
          setTimeout(() => {
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                func: getStatus,
              },
              (results) => {
                const status = results[0].result;
                document.getElementById("tableData").innerText = status;
              },
            );
          }, 1000);
        },
      );
    });
  });

  document.getElementById("triggerSpanButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        world: "MAIN",
        func: triggerSpanOnClick,
      });
    });
  });

  document
    .getElementById("triggerNewSpanButton")
    .addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          world: "MAIN",
          func: triggerNewSpanOnClick,
        });
      });
    });

  document
    .getElementById("extractClassOptionsButton")
    .addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: extractClassOptionsTable,
          },
          (results) => {
            const data = results[0].result;
            document.getElementById("tableData").innerText = data;
          },
        );
      });
    });
});

function triggerOnClick() {
  const row = document.querySelector("tr[id='PLANNER_ITEMS_NFF$0_row_0']");
  if (row && typeof OnRowAction === "function") {
    OnRowAction(row, "SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$0");
  }
}

function getStatus() {
  const statusDiv = document.querySelector(
    "#win4divSTATUS$0 .ps_box-htmlarea .ps-htmlarea",
  );
  if (!statusDiv) {
    return "Status not found.";
  } else {
    return statusDiv.innerText.trim();
  }
}

function triggerSpanOnClick() {
  const anchor = document.getElementById("DERIVED_SAA_CRS_SSR_PB_GO$6$");
  if (anchor) {
    anchor.click();
  }
}

function triggerNewSpanOnClick() {
  const anchor = document.getElementById("SSR_CRS_TERM_WK_SSS_TERM_LINK$17$$0");
  if (anchor) {
    anchor.click();
  }
}

function extractClassOptionsTable() {
  const table = document.querySelector(
    "table.ps_grid-flex[title='Class Options']",
  );
  if (!table) return "Table not found.";
  let data = "";
  const headers = table.querySelectorAll("thead th");
  headers.forEach((header) => {
    data += header.textContent.trim() + "\t";
  });
  data += "\n";
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    cells.forEach((cell) => {
      data += cell.textContent.trim().replace(/\s+/g, " ") + "\t";
    });
    data += "\n";
  });
  return data;
}
