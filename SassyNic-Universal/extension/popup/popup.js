// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   // Auto Login
   const checkbox = document.getElementById("switch-auto-otp-extractor");

   // Load saved state from storage when popup opens
   chrome.storage.local.get("autoLoginEnabled", function (data) {
      console.log("Loaded from storage:", data);
      checkbox.checked = data.autoLoginEnabled || false; // Default to false if not set
   });

   checkbox.addEventListener("change", function () {
      const isChecked = checkbox.checked;

      // Save state to storage
      chrome.storage.local.set({ autoLoginEnabled: isChecked }, function () {
         console.log("Auto OTP Extractor State saved:", isChecked);
      });
   });

   // Error Code Reference
   document.getElementById("btnErrorCode").addEventListener("click", function() {
      chrome.tabs.create({ url: "https://github.com/FramedStone/SassyNic/wiki/Error-Reference" });
   });
});