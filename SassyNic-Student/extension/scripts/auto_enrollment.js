console.log('auto_enrollment.js successfully injected');

/**
 * Normalizes term text to match expected format
 * @param {string} termText - Raw term text from DOM
 * @returns {string} Normalized term string
 */
function normalizeTerm(termText) {
  return termText
    .replace(/\s*\/\s*/g, '/')
    .replace(/(\b\w{3})\w*\s*\/\s*(\b\w{3})\w*/g, '$1/$2')
    .trim();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Select course by matching title + code
  if (message.action === 'enrollSelectCourse_') {
    console.log('enrollSelectCourse_ received:', message.courseTitle, message.courseCode);

    waitForElement({
      selector: 'table tbody tr',
      method: 'querySelectorAll',
    }).then(() => {
      const rows = document.querySelectorAll('table[title="Non-Small Form Factor"] tbody tr');
      let foundIndex = -1;

      rows.forEach((row, index) => {
        const titleEl = document.getElementById(`SSR_PLNR_FL_WRK_SSR_CLASSNAME_LONG$${index}`);
        if (titleEl) {
          const titleText = titleEl.textContent.trim();
          // Match by title (code is typically part of the title or can be verified separately)
          if (titleText === message.courseTitle || titleText.includes(message.courseCode)) {
            foundIndex = index;
          }
        }
      });

      if (foundIndex !== -1) {
        console.log('Course found at index:', foundIndex);
        document.getElementById(`PLANNER_ITEMS_NFF$0_row_${foundIndex}`).click();

        chrome.runtime.sendMessage({
          action: 'enrollCourseSelected',
          foundIndex: foundIndex,
          tabId: message.tabId,
        });
      } else {
        console.log('Course not found:', message.courseTitle, message.courseCode);
        chrome.runtime.sendMessage({
          action: 'enrollmentCourseNotFound',
          tabId: message.tabId,
        });
      }
    });

    return true;
  }

  // Wait for "View Classes" button to be ready
  if (message.action === 'enrollViewClasses_') {
    console.log('enrollViewClasses_ received');

    waitForElement({
      selector: 'div.ps_box-button.psc_primary span a',
      method: 'querySelector',
      attributes: {
        onclick: true,
      },
    }).then(() => {
      chrome.runtime.sendMessage({
        action: 'enrollViewClassesReady',
        tabId: message.tabId,
      });
    });

    return true;
  }

  // Select term - uses Promise.race like extraction.js
  if (message.action === 'enrollSelectTerm_') {
    console.log('enrollSelectTerm_ received, term:', message.term);

    // Promise 1: Term selection page (multi-term course)
    const firstPromise = waitForElement({
      selector: 'td.ps_grid-cell div.ps_box-group.psc_layout span.ps-link-wrapper a.ps-link',
      method: 'querySelectorAll',
      attributes: {
        onclick: true,
      },
    }).then(() => {
      const terms = document.querySelectorAll(
        'td.ps_grid-cell div.ps_box-group.psc_layout span.ps-link-wrapper a.ps-link'
      );

      // Match term with extracting term selection
      Array.from(terms).some((term_) => {
        let term = term_.textContent
          .replace(/\s*\/\s*/g, '/') // Remove spaces around '/'
          .replace(/(\b\w{3})\w*\s*\/\s*(\b\w{3})\w*/g, '$1/$2') // Keep only first 3 letters of each month
          .trim();

        if (term == message.term) {
          // Action to take if the first promise resolves
          chrome.runtime.sendMessage({
            action: 'enrollTermSelected',
            term: message.term,
            tabId: message.tabId,
          });
          return true;
        }
      });
    });

    // Promise 2: Already on class details page (single-term course)
    const secondPromise = waitForElement({
      selector: 'TERM_VAL_TBL_DESCR',
      method: 'getElementById',
    }).then(() => {
      let term = document
        .getElementById('TERM_VAL_TBL_DESCR')
        .textContent.replace(/\s*\/\s*/g, '/') // Remove spaces around '/'
        .replace(/(\b\w{3})\w*\s*\/\s*(\b\w{3})\w*/g, '$1/$2') // Keep only first 3 letters of each month
        .trim();

      // Check if term matching
      if (term === message.term) {
        chrome.runtime.sendMessage({
          action: 'enrollTermReady',
          term: message.term,
          tabId: message.tabId,
        });
      } else {
        console.log(message.term);
        console.log(term);
        alert('1001_EXTRACTION_TERM_NOT_MATCHING');
        sendResponse({ status: 'error', code: 1001 });
        return true;
      }
    });

    // Use Promise.race to trigger whichever promise resolves first
    Promise.race([firstPromise, secondPromise]);
    return true;
  }

  // Navigate back complete (handled by background.js, but we keep this for consistency)
  if (message.action === 'enrollNavigateBack') {
    console.log('enrollNavigateBack received');

    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        world: 'MAIN',
        func: () => {
          window.history.back();
        },
      })
      .then(() => {
        // Wait for page to load, then navigate back again
        setTimeout(() => {
          chrome.scripting
            .executeScript({
              target: { tabId: message.tabId },
              world: 'MAIN',
              func: () => {
                window.history.back();
              },
            })
            .then(() => {
              chrome.runtime.sendMessage({
                action: 'enrollNavigateBackComplete',
                tabId: message.tabId,
              });
            });
        }, 1000);
      });

    return true;
  }

  return true;
});

/**
 * Waits for an element to appear in the DOM using specified selection methods and attribute conditions,
 * optionally filtering by textContent or value, and ensuring the element is interactable before resolving.
 * @param {string} selector - The CSS selector or ID for the target element(s).
 * @param {string} method - The selection method: 'querySelector', 'querySelectorAll', 'getElementById'.
 * @param {Object} [observerConfig={ attributes: true, childList: true, subtree: true }] - MutationObserver configuration.
 * @param {Object|Array} [attributes=null] - Attribute conditions to check.
 * @param {string} [textContent=null] - Specific textContent to match.
 * @param {string} [value=null] - Specific value to match.
 * @returns {Promise<Element>} - Resolves with the found element that meets all conditions.
 */
function waitForElement({
  selector,
  method = 'querySelector',
  observerConfig = { attributes: true, childList: true, subtree: true },
  attributes = null,
  textContent = null,
  value = null,
}) {
  return new Promise((resolve, reject) => {
    let selectFunction;

    switch (method) {
      case 'querySelector':
        selectFunction = () => document.querySelector(selector);
        break;
      case 'querySelectorAll':
        selectFunction = () => {
          const nodeList = document.querySelectorAll(selector);
          return nodeList.length > 0 ? nodeList : null;
        };
        break;
      case 'getElementById':
        const id = selector.startsWith('#') ? selector.slice(1) : selector;
        selectFunction = () => document.getElementById(id);
        break;
      default:
        reject(
          new Error(
            `Unsupported selection method: "${method}". Use 'querySelector', 'querySelectorAll', or 'getElementById'.`
          )
        );
        return;
    }

    function isElementInteractable(element) {
      if (!element) return false;

      const style = window.getComputedStyle(element);
      const isVisible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0;

      if (!isVisible) return false;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const topElement = document.elementFromPoint(centerX, centerY);
      const isNotObstructed = topElement === element || element.contains(topElement);

      return isNotObstructed;
    }

    function checkAttributes(element) {
      if (!attributes) return true;

      if (typeof attributes === 'object' && !Array.isArray(attributes)) {
        for (let [attr, condition] of Object.entries(attributes)) {
          if (typeof condition === 'function') {
            const attrValue = element.getAttribute(attr);
            if (!condition(attrValue)) {
              return false;
            }
          } else if (condition === true) {
            if (!element.hasAttribute(attr)) {
              return false;
            }
          } else {
            if (element.getAttribute(attr) !== condition) {
              return false;
            }
          }
        }
        return true;
      } else if (Array.isArray(attributes)) {
        return attributes.every((attr) => element.hasAttribute(attr));
      }

      return true;
    }

    function matchesFilter(element) {
      if (textContent && element.textContent.trim() !== textContent) {
        return false;
      }
      if (value && element.value !== value) {
        return false;
      }
      return true;
    }

    const initialElements = selectFunction();
    if (initialElements) {
      if (method === 'querySelectorAll') {
        const foundElement = Array.from(initialElements).find(
          (el) => checkAttributes(el) && isElementInteractable(el) && matchesFilter(el)
        );
        if (foundElement) {
          resolve(foundElement);
          return;
        }
      } else {
        if (
          checkAttributes(initialElements) &&
          isElementInteractable(initialElements) &&
          matchesFilter(initialElements)
        ) {
          resolve(initialElements);
          return;
        }
      }
    }

    const observer = new MutationObserver((mutations, obs) => {
      const elements = selectFunction();
      if (elements) {
        if (method === 'querySelectorAll') {
          const foundElement = Array.from(elements).find(
            (el) => checkAttributes(el) && isElementInteractable(el) && matchesFilter(el)
          );
          if (foundElement) {
            resolve(foundElement);
            obs.disconnect();
          }
        } else {
          if (
            checkAttributes(elements) &&
            isElementInteractable(elements) &&
            matchesFilter(elements)
          ) {
            resolve(elements);
            obs.disconnect();
          }
        }
      }
    });

    observer.observe(document.body, observerConfig);
  });
}
