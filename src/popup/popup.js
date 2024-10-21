const iframeStatus = document.getElementById("iframeStatus");
const iframeData = document.getElementById("iframeData");

// Select the iframe
const iframe = document.querySelector("#ptifrmtgtframe");

if (!iframe) {
  iframeStatus.innerHTML = "No iframe found";
} else {
  // Set up an onload handler to ensure content is loaded
  iframe.onload = function () {
    iframeStatus.innerHTML = "Iframe loaded";
  };
}
