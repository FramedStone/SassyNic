document.addEventListener('DOMContentLoaded', function() {
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

      let courseTotal = 0;
      let courseTotal_ = false;

      do {
        // Planner
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: () => {
            const planner = Array.from(document.querySelectorAll('div.ps_box-group .psc_layout .psa_vtab .psc_rowact a.ps-link')).find(span =>
              span.querySelector('.ps-text')?.textContent.trim() === 'Planner'
            );

            if(planner)
              planner.click();
          }
        });

        // select 'Trimester/Terms' to extract
        alert("Please select the Trimester/Terms to extract.");

        const result = await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: () => {
            const trimesterList = document.querySelectorAll('td.ps_grid-cell.TERMS a')
            const trimester = Array.from(trimesterList).map(trimester => trimester.textContent.trim());
            return trimester
          }
        })

        // Trimester/Terms inside Planner
        // append buttons to 'trimester-list'
        const trimesterList = document.getElementById("trimester-list")
        trimesterList.innerHTML = "";
        result[0].result.forEach((trimester, index) => {
          const button = document.createElement("button");
          button.textContent = trimester;
          button.className = "action-button";
          button.id = index;
          button.onclick = async () => {
            await chrome.scripting.executeScript({
              target: {tabId: tabId},
              world: 'MAIN',
              func: (index) => {
                OnRowAction(this, `SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$${index}`)
                localStorage.setItem('courseSelected', index)
              },
              args: [index]
            })
          }

          trimesterList.appendChild(button);
        })

        // Wait for any button to be clicked
        function waitForAnyButton() {
          return new Promise((resolve) => {
            trimesterList.addEventListener(
              "click",
              (event) => {
                if (event.target.tagName === "BUTTON") {
                  resolve(event.target.id); // Resolve with the clicked button
                }
              },
              { once: true } // Ensure the listener is triggered only once
            );
          });
        }

        await waitForAnyButton();

        // update 'courseTotal'
        if(!courseTotal_) {
          const result = await chrome.scripting.executeScript({
            target: {tabId: tabId},
            world: 'MAIN',
            func: () => {
              // const courseTotal_ = document.querySelectorAll('td.ps_grid-cell.COURSES span').textContent.trim();
              const buttonId = localStorage.getItem('courseSelected'); 
              const courseTotal = document.getElementById(`SSR_PLNR_FL_WRK_COURSES_ATTEMPTED$${buttonId}`).textContent.trim(); 
              return courseTotal;
            },
          });

          courseTotal = result[0].result; 
          courseTotal_ = true;
        }

        await waitForElement('td.ps_grid-cell.COURSE', tabId);

        // Course selection interface
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          world: 'MAIN',
          func: (courseTotal) => {
            console.log(courseTotal);
            OnRowAction(this,`SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG$${courseTotal}`);
          },
          args: [courseTotal-1]
        });

        // View Classes

        // Trimester

        // Extract Classes Details

        courseTotal--;
      }while(courseTotal != 0);
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
    
});

/**
 * 
 * @param {*} selector 
 * @param {*} tabId 
 * @returns 
 */
function waitForElement(selector, tabId) {
  return new Promise((resolve, reject) => {
    const checkInterval = document.getElementById('interval').value; // Interval to check for the element
    let timeout = document.getElementById('timeout').value; // How many tries before timeout

    chrome.scripting.executeScript({
      target: {tabId, tabId},
      world: 'MAIN',
      func: async (selector, checkInterval, timeout) => {
        await new Promise((resolve, reject) => {
          let attempt = 0;

          const checkExistence = () => {
            const selector_ = document.querySelector(selector);
            console.log(selector_)
            if(selector_) {
              resolve();
            } else if (attempt < timeout) {
              attempt++;
              setTimeout(checkExistence, checkInterval);
            } else {
              reject(`Element "${selector}" not found after ${timeout} attempts.`);
            }
          }

          checkExistence();
        })
      },
      args: [selector, checkInterval, timeout]
    },
    (result) => {
      if(chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (result && result[0] && result[0].result) {
        resolve(true);
      } else {
        reject(`Failed to find element with selector "${selector}".`);
      }
    });
  })
}