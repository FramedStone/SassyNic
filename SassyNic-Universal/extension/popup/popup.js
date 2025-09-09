// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function () {
  // Auto Login
  const checkbox = document.getElementById('switch-auto-otp-extractor');

  // Load saved state from storage when popup opens
  chrome.storage.local.get('autoLoginEnabled', function (data) {
    console.log('Loaded from storage:', data);

    if (data.autoLoginEnabled === undefined) {
      // No value saved yet, set default to true
      chrome.storage.local.set({ autoLoginEnabled: true }, function () {
        console.log('Initial: Auto OTP Extractor State saved:', true);
        checkbox.checked = true;
      });
    } else {
      // Value exists, use it
      checkbox.checked = data.autoLoginEnabled;
    }
  });

  checkbox.addEventListener('change', function () {
    const isChecked = checkbox.checked;

    // Save state to storage
    chrome.storage.local.set({ autoLoginEnabled: isChecked }, function () {
      console.log('Auto OTP Extractor State saved:', isChecked);
    });
  });

  // Useful Buttons 
  document.getElementById('btnErrorCode').addEventListener('click', function () {
    chrome.tabs.create({
      url: 'https://github.com/FramedStone/SassyNic/wiki/Error-Reference',
    });
  });

  // document.getElementById('btnWiki').addEventListener('click', () => {
  //   chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic/wiki' });
  // });

  document.getElementById('btnRoadMap').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/users/FramedStone/projects/2/views/2' });
  });

  document.getElementById('btnFeedback').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://forms.gle/SUsghNXUKW1u1US5A' });
  });
});
