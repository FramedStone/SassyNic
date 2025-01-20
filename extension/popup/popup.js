// wait for popup.html to be loaded
document.addEventListener('DOMContentLoaded', function() {
   document.getElementById('btnExtraction').addEventListener('click', () => {
      const choice = confirm("\nContinue with extraction (OK)\nClose to watch the tutorial (Cancel)\n\nNote: Make sure to watch the tutorial to prevent any unwanted issues!");

      if(choice) {
         // send message to background.js to start extraction 
         chrome.runtime.sendMessage({ action: "startExtraction" });
      } else {
         chrome.tabs.create({ url: "./extension/tutorial-videos/index.html" });
      }
   });

// Theme toggle functionality
const themeToggle = document.querySelector('.theme-switch input[type="checkbox"]')

function switchTheme(e) {
  if (e.target.checked) {
    document.documentElement.setAttribute("data-theme", "light")
    localStorage.setItem("theme", "light")
  } else {
    document.documentElement.setAttribute("data-theme", "dark")
    localStorage.setItem("theme", "dark")
  }
}

themeToggle.addEventListener("change", switchTheme, false)

const currentTheme = localStorage.getItem("theme") ? localStorage.getItem("theme") : null

if (currentTheme) {
  document.documentElement.setAttribute("data-theme", currentTheme)

  if (currentTheme === "light") {
    themeToggle.checked = true
  }
}
});