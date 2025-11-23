// Helper function to get the active tabId
export function getActiveTabId(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      callback(tabs[0].id); // Pass the tabId to the callback function
    } else {
      console.error('No active tab found.');
      callback(null); // In case no active tab is found
    }
  });
}

// Helper function to get updated tab
export function onTabUpdated(target_tabId = null, callback) {
  const listener = (tabId, changeInfo, tab) => {
    if (target_tabId !== null) {
      if (tabId === target_tabId && changeInfo.status === 'complete') {
        callback(tabId, tab);
        chrome.tabs.onUpdated.removeListener(listener);
      }
    } else {
      if (changeInfo.status === 'complete') {
        callback(tabId, tab);
        chrome.tabs.onUpdated.removeListener(listener);
      }
    }
  };
  chrome.tabs.onUpdated.addListener(listener);
}

// Helper function to lead users to associated error section within the wiki
export function getError(code) {
  chrome.tabs.create({
    url: `https://github.com/FramedStone/SassyNic/wiki/Error-Reference#${code}`,
  });
}

export function useGET(requestUrl) {
  return fetch(requestUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text().then((text) => ({ status: response.status, text }));
  });
}

export function usePOST(requestUrl, icParamsOrAction) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        reject(new Error('No active tab found'));
        return;
      }

      const tabId = tabs[0].id;

      chrome.tabs.sendMessage(tabId, { action: 'getFormData' }, (formResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const formData = new URLSearchParams();

        if (formResponse?.success && formResponse?.formData) {
          Object.entries(formResponse.formData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        if (icParamsOrAction) {
          if (typeof icParamsOrAction === 'string') {
            if (formData.has('ICAction')) {
              formData.set('ICAction', icParamsOrAction);
            } else {
              formData.append('ICAction', icParamsOrAction);
            }
          } else if (typeof icParamsOrAction === 'object') {
            Object.entries(icParamsOrAction).forEach(([key, value]) => {
              if (formData.has(key)) {
                formData.set(key, value);
              } else {
                formData.append(key, value);
              }
            });
          }
        }

        if (!formData.has('ICAJAX')) {
          formData.append('ICAJAX', '1');
        }

        fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text().then((text) => ({ status: response.status, text }));
          })
          .then(resolve)
          .catch(reject);
      });
    });
  });
}
