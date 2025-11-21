import { getActiveTabId, onTabUpdated, getError, useGET, usePOST } from './helpers/utils.js';
import { pruneSchedule } from './helpers/constraints.js';

// Navigate to 'SassyNic' github wiki on installed
// chrome.runtime.onInstalled.addListener(({ reason }) => {
//   if (reason === 'install' || reason === 'update')
//     chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic' });
// });

// -------------------------------------------- WebRequest Listeners -----------------------------------------------------//
chrome.webRequest.onCompleted.addListener(
  function(details) {
    console.log(details);
  },
  {
    urls: ['*://*.mmu.edu.my/*'],
    types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
  }
);

// -------------------------------------------- extraction.js & auto_enrollment.js -----------------------------------------------------//
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchPlanner') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        sendResponse({ error: 'No active tab found' });
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'checkPlannerInterface' }, (checkResponse) => {
        if (chrome.runtime.lastError || !checkResponse?.success || !checkResponse?.exists) {
          sendResponse({ error: 'NOT_PLANNER_INTERFACE' });
          return;
        }

        const url =
          'https://clic.mmu.edu.my/psc/csprd_522/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_PLANNER_FL.GBL?Page=SSR_PLNR_TERM_FL&pslnkid=CS_SSR_PLANNER_FL_LINK&ICAJAX=1&ICMDTarget=start&ICPanelControlStyle=%20pst_side1-fixed%20pst_panel-mode%20';

        useGET(url)
          .then((result) => {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: 'extractPlanner', html: result.text },
              (response) => {
                if (chrome.runtime.lastError) {
                  sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                  sendResponse(response);
                }
              }
            );
          })
          .catch((error) => {
            console.error('Error fetching planner:', error);
            sendResponse({ error: error.message });
          });
      });
    });

    return true;
  }

  if (message.action === 'fetchTermToExtract') {
    fetchTermToExtract(sendResponse);
    return true;
  }

  if (message.action === 'fetchPlannerDetail') {
    fetchPlannerDetail(message.dataId);
    return true;
  }
});

function fetchPlannerDetail(dataId) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      console.error('No active tab found for form data extraction');
      return;
    }

    const tabId = tabs[0].id;
    const postUrl =
      'https://clic.mmu.edu.my/psc/csprd_1/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_PLANNER_FL.GBL';

    usePOST(postUrl, dataId)
      .then((postResult) => {
        if (postResult.status !== 200) {
          throw new Error(`POST request failed with status: ${postResult.status}`);
        }

        const getUrl =
          'https://clic.mmu.edu.my/psc/csprd_554/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_PLANNER_FL.GBL?Page=SSR_PLNR_ITEM_FL&Action=U&ICAJAX=1&ICMDTarget=start&ICPanelControlStyle=%20pst_side1-fixed%20pst_panel-mode%20';

        return useGET(getUrl);
      })
      .then((getResult) => {
        chrome.tabs.sendMessage(
          tabId,
          {
            action: 'extractElements',
            html: getResult.text,
            elementIds: [
              'SSR_PLNR_FL_WRK_SSS_SUBJ_CATLG',
              'SSR_PLNR_FL_WRK_SSR_CLASSNAME_LONG',
              'SSR_PLNR_FL_WRK_UNITS_RANGE',
            ],
          },
          (extractResponse) => {
            if (chrome.runtime.lastError) {
              console.error('Error extracting elements:', chrome.runtime.lastError.message);
              chrome.runtime.sendMessage({
                action: 'displayCourses',
                dataId: dataId,
                courses: 'error',
              });
              return;
            }

            if (extractResponse?.success) {
              console.log('Extracted courses:', extractResponse.courses);
              chrome.runtime.sendMessage({
                action: 'displayCourses',
                dataId: dataId,
                courses: extractResponse.courses,
              });
            }
          }
        );
      })
      .catch((error) => {
        console.error('Error fetching planner detail:', error);
      });
  });
}

function fetchTermToExtract(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      console.error('No active tab found for Term To Extract request');
      sendResponse({ error: 'No active tab found' });
      return;
    }

    const tabId = tabs[0].id;
    const postUrl =
      'https://clic.mmu.edu.my/psc/csprd_561/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_PLNR_CRSE_FL.GBL';

    usePOST(
      'https://clic.mmu.edu.my/psc/csprd_608/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_PLANNER_FL.GBL',
      'SSR_PLNR_FL_WRK_TERM_DETAIL_LINK$0'
    )
      .then((postResult) => {
        if (postResult.status !== 200) {
          throw new Error(`POST request failed with status: ${postResult.status}`);
        }

        return useGET(
          'https://clic.mmu.edu.my/psc/csprd_613/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_PLNR_CRSE_FL.GBL?Page=SSR_CRSE_DTL_FL&Action=U&CRSE_ID=007375&CRSE_OFFER_NBR=1&EFFDT=2025-11-21&ICAJAX=1&ICMDTarget=start&ICPanelControlStyle=%20pst_side1-fixed%20pst_panel-mode%20'
        );
      })
      .then(() => {
        return usePOST(postUrl, 'DERIVED_SAA_CRS_SSR_PB_GO$6');
      })
      .then((postResult) => {
        if (postResult.status !== 200) {
          throw new Error(`POST request failed with status: ${postResult.status}`);
        }

        const getUrl =
          'https://clic.mmu.edu.my/psc/csprd_578/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_CRSE_TERM_FL.GBL?Page=SSR_CRSE_TERM_FL&Action=U&ICAJAX=1&ICMDTarget=start&ICPanelControlStyle=%20pst_side1-fixed%20pst_panel-mode%20';

        return useGET(getUrl);
      })
      .then((getResult) => {
        console.log('Term To Extract GET response:', getResult.text);
        chrome.tabs.sendMessage(
          tabId,
          {
            action: 'extractTermLinks',
            html: getResult.text,
            elementIds: ['SSR_CRS_TERM_WK_SSS_TERM_LINK'],
          },
          (extractResponse) => {
            if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
            } else {
              sendResponse(extractResponse);
            }
          }
        );
      })
      .catch((error) => {
        console.error('Error fetching Term To Extract:', error);
        sendResponse({ error: error.message });
      });
  });
}
