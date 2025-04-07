console.log("auto_subejcts_group.js injected");

chrome.runtime.onMessage.addListener((message) => {
    if(message.action === "AGS_Start_") {
        // Initial
        if(message.termTo === null) {
            let termFrom = document.querySelector('span.ps-text[id="PANEL_TITLElbl"]').textContent

            document.getElementById(`PLANNER_ITEMS_NFF$0_row_0`).click();
            chrome.runtime.sendMessage({ action: "AGS_MoveToTerm", termFrom: termFrom, termTo: message.termTo, tabId: message.tabId });
        } else {
            // Click 'Planner'
            const spans = document.querySelectorAll('span.ps-text');
            spans.forEach(span => {
                if(span.textContent === 'Planner')
                    span.click();
            });
            chrome.runtime.sendMessage({ action: "AGS_SelectTerm", termFrom: message.termFrom, termTo: message.termTo, tabId: message.tabId });
        }
    }

    if(message.action === "AGS_MoveToTerm_") {
        waitForElement({
            selector: "span[title='Change to Term'] a",
            method: "querySelector"
        }).then(() => {
            // Move To Term button (sent back to background.js to execute the click due to CSP restriction)
            chrome.runtime.sendMessage({ action: "AGS_MoveToTerm_Click", termFrom: message.termFrom, termTo: message.termTo, tabId: message.tabId });
        });
    }

    if(message.action === "AGS_MoveToTerm_Click_") {
        if(message.termTo === null) {
            alert("Select the term that you want to move --> Save");
            waitForElement({
                selector: "a",
                method: "querySelectorAll"
            }).then(() => {
                // Dynamic generated popup modal, hence sending back to background.js to extract
                chrome.runtime.sendMessage({ action: "AGS_SelectedTerm", termFrom: message.termFrom, termTo: message.termTo, tabId: message.tabId });
            });
        } else {
            waitForElement({
                selector: "PANEL_TITLElbl",
                method: "getElementById",
                textContent: message.termTo,
            }).then(() => {
                chrome.runtime.sendMessage({ action: "AGS_SelectedTerm", termFrom: message.termFrom, termTo: message.termTo, tabId: message.tabId });
            });
        }
    }

    if(message.action === "AGS_SelectTerm_") {
        waitForElement({
            selector: "td[class='ps_grid-cell TERMS'] a",
            method: "querySelectorAll"
        }).then(() => {
            // observer disconnect factor (look for termFrom row)
            const termFrom = Array.from(document.querySelectorAll("td[class='ps_grid-cell TERMS'] a")).find(a => a.textContent === message.termFrom);
            if(!termFrom) {
                chrome.runtime.sendMessage({ action: "AGS_MoveToTerm_Click", termFrom: message.termFrom, termTo: message.termTo, AGS_Stop: true, tabId: message.tabId });
            } else {
                // Select Term (sent back to background.js to execute the click due to CSP restriction)
                chrome.runtime.sendMessage({ action: "AGS_SelectSubject", termFrom: message.termFrom, termTo: message.termTo, tabId: message.tabId });
            }
        });
    }

    if(message.action === "AGS_SelectSubject_") {
        waitForElement({
            selector: "PLANNER_ITEMS_NFF$0_row_0",
            method: "getElementById"
        }).then(() => {
            document.getElementById(`PLANNER_ITEMS_NFF$0_row_0`).click();
            chrome.runtime.sendMessage({ action: "AGS_MoveToTerm", termFrom: message.termFrom, termTo: message.termTo, tabId: message.tabId });
        });
    }
});