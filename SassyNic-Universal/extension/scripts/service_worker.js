import { getActiveTabId, onTabUpdated } from './helpers/utils.js';

chrome.runtime.onMessage.addListener((message) => {
  // Auto Login
  if (message.action === 'autoOTPExtractor') {
    getActiveTabId((active_tab_id) => {
      if (active_tab_id !== null) {
        // Create a new tab and navigate to Outlook.
        chrome.tabs.create({ url: 'https://outlook.office.com' }, (new_tab) => {
          let personalAlertShown = false;

          function waitForTenantLogo(tab_id) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab_id },
                world: 'MAIN',
                func: () => {
                  return new Promise((resolve) => {
                    // Check if the page URL indicates a personal account.
                    if (window.location.href.includes('https://outlook.live.com/mail/')) {
                      resolve('personal');
                      return;
                    }
                    // Helper to detect the MMU Email
                    const detectMMUEmail = () => {
                      let profileDiv = document.getElementById('O365_MainLink_Me');
                      console.log(profileDiv);
                      if (profileDiv) {
                        profileDiv.click();
                        // Using regex test for string '@student.mmu.edu.my' and '@mmu.edu.my'
                        return /@.*mmu\.edu\.my$/.test(
                          document
                            .getElementById('mectrl_currentAccount_secondary')
                            .textContent.trim()
                        );
                      } else {
                        return false;
                      }
                    };
                    if (document.readyState === 'complete') {
                      if (detectMMUEmail()) {
                        resolve(true);
                      } else {
                        const observer = new MutationObserver((mutations, obs) => {
                          if (detectMMUEmail()) {
                            obs.disconnect();
                            resolve(true);
                          }
                        });
                        observer.observe(document.body, { childList: true, subtree: true });
                      }
                    } else {
                      window.addEventListener('load', () => {
                        setTimeout(() => {
                          if (detectMMUEmail()) {
                            resolve(true);
                          } else {
                            const observer = new MutationObserver((mutations, obs) => {
                              if (detectMMUEmail()) {
                                obs.disconnect();
                                resolve(true);
                              }
                            });
                            observer.observe(document.body, { childList: true, subtree: true });
                          }
                        }, 1000);
                      });
                    }
                  });
                },
              },
              (results) => {
                if (results && results[0]?.result === true) {
                  console.log('MMU MMU email detected');
                  extractOTP(tab_id);
                } else if (results && results[0]?.result === 'personal') {
                  // If a personal account is detected, alert once in the MAIN world.
                  if (!personalAlertShown) {
                    chrome.scripting.executeScript({
                      target: { tabId: tab_id },
                      world: 'MAIN',
                      func: () => {
                        alert(
                          'Kindly login into your MMU outlook account.\n\nNote: Do not close this tab, just sign out and sign in into your MMU account using this tab.'
                        );
                      },
                    });
                    personalAlertShown = true;
                  }
                  console.log('Personal account detected, waiting for next update...');
                  onTabUpdated(tab_id, (updated_tab_id) => {
                    waitForTenantLogo(updated_tab_id);
                  });
                } else {
                  console.log('MMU MMU email not detected, waiting for next update...');
                  onTabUpdated(tab_id, (updated_tab_id) => {
                    waitForTenantLogo(updated_tab_id);
                  });
                }
              }
            );
          }

          /**
           * Helper function that will extract the 6 digits OTP and delete the mail once it found the same regex pattern within mail
           * @param {String} tab_id
           */
          function extractOTP(tab_id) {
            chrome.scripting
              .executeScript({
                target: { tabId: tab_id },
                world: 'MAIN',
                func: (timestamp) => {
                  console.log('Timestamp from CliC OTP request webpage:', timestamp);
                  return new Promise((resolve) => {
                    const observer = new MutationObserver((mutations, obs) => {
                      const spans = document.querySelectorAll('span');
                      spans.forEach((span) => {
                        if (span.innerText.includes(timestamp)) {
                          const otp_match = span.innerText.match(/\b\d{6}\b/);
                          const otp = otp_match ? otp_match[0] : 'OTP not found';

                          // Delete the mail
                          const divWrapper = span.closest('div[role="group"]');
                          const deleteBtn = divWrapper.querySelector('div[title="Delete"]');
                          if (deleteBtn) {
                            deleteBtn.click();
                            obs.disconnect();
                            setTimeout(() => resolve(otp), 500);
                          }
                        }
                      });
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                  });
                },
                args: [message.timestamp],
              })
              .then((results) => {
                const extracted_otp = results[0]?.result || 'OTP not found';
                // Remove outlook tab
                chrome.tabs.remove(tab_id);

                // Insert OTP and validate OTP
                chrome.scripting.executeScript({
                  target: { tabId: active_tab_id },
                  world: 'MAIN',
                  func: (otp) => {
                    if (otp === 'OTP not found') {
                      alert('2001_OTP_NOT_FOUND');
                      return true;
                    }
                    document.getElementById('otp').value = otp;
                    document.getElementById('ps_submit_button').click();
                  },
                  args: [extracted_otp],
                });
              })
              .catch((error) => {
                console.log('OTP error:', error);
                // Remove outlook tab and focus back to CliC tab
                chrome.tabs.remove(tab_id);
                chrome.tabs.update(active_tab_id, { active: true });
                chrome.scripting.executeScript({
                  target: { tabId: active_tab_id },
                  world: 'MAIN',
                  func: () => {
                    alert('2001_OTP_NOT_FOUND');
                    return true;
                  },
                });
              });
          }

          waitForTenantLogo(new_tab.id);
        });
      } else {
        console.log('No active tab found!');
      }
    });
  }
});
