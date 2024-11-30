// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   document.getElementById('btnExtraction').addEventListener('click', () => {
       const timeout = parseInt(document.getElementById('timeout').value, 10);

        // send message to background.js to start extraction 
        chrome.runtime.sendMessage({action: "startExtraction", timeout: timeout}, (response) =>{
            const div = document.getElementById('data');
            div.innerHTML = response.message;
        });
   });
});