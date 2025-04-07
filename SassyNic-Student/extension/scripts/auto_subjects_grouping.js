console.log("auto_subejcts_group.js injected");

chrome.runtime.onMessage.addListener((message) => {
    if(message.action === "AGS_Start") {
        // Initial
        if(message.index === 0) {
            let termFrom = document.querySelector('span.ps-text[id="PANEL_TITLElbl"]').textContent
            let subjectTotal = document.querySelectorAll('table[title="Non-Small Form Factor"] tbody tr').length;

            document.getElementById(`PLANNER_ITEMS_NFF$0_row_${message.index}`).click();
            chrome.runtime.sendMessage({ action: "AGS_MoveToTerm", termFrom: termFrom, subjectTotal: subjectTotal, index: message.index, tabId: message.tabId });
        } else {
            // Click 'Planner'
            const spans = document.querySelectorAll('span.ps-text');
            spans.forEach(span => {
                if(span.textContent === 'Planner')
                    span.click();
            });
            chrome.runtime.sendMessage({ action: "AGS_MoveToTerm", termFrom: message.termFrom, termTo: message.termTo, index: message.index , tabId: message.tabId });
        }
    }

    if(message.action === "AGS_MoveToTerm_") {
        waitForElement({
            selector: "span[title='Change to Term'] a",
            method: "querySelector"
        }).then(() => {
            // Move To Term button (sent back to background.js to execute the click due to CSP restriction)
            chrome.runtime.sendMessage({ action: "AGS_SelectTerm", termFrom: message.termFrom, termTo: message.termTo, index: message.index, tabId: message.tabId });
        });
    }

    if(message.action === "AGS_SelectTerm_") {
        alert("Select the term that you want to move --> Save");

        waitForElement({
            selector: "a",
            method: "querySelectorAll"
        }).then(() => {
            // Initial
            if(message.index === 0) {
                // Dynamic generated popup modal, hence sending back to background.js to extract
                chrome.runtime.sendMessage({ action: "AGS_SelectedTerm", termFrom: message.termFrom, index: message.index, tabId: message.tabId });
            } else {
                // TODO: move the rest subjects into selected term
                console.log("index: ", message.index);
                console.log("term from: ", message.termFrom);
                console.log("term to: ", message.termTo);
            }
        });
    }
});