let termsFetched = false;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btnErrorCode').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic/wiki/Error-Reference' });
  });

  document.getElementById('btnWiki').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/FramedStone/SassyNic/wiki' });
  });

  document.getElementById('btnRoadMap').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/users/FramedStone/projects/2/views/2' });
  });

  document.getElementById('btnFeedback').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://forms.gle/SUsghNXUKW1u1US5A' });
  });

  const timetableDropdown = document.getElementById('timetableDropdown');
  const termToExtractDropdown = document.getElementById('termToExtractDropdown');

  termToExtractDropdown.addEventListener('toggle', function() {
    if (this.open && !termsFetched) {
      fetchTerms();
    }
  });
});

function fetchTerms() {
  chrome.runtime.sendMessage({ action: 'fetchTerms' }, (response) => {
    if (response?.status === 'success') {
      displayTerms(response.terms);
    } else {
      const termSelection = document.getElementById('termSelection');
      termSelection.innerHTML =
        '<p class="error-msg">Failed to load terms. Please refresh the page.</p>';
    }
  });
}

function displayTerms(terms) {
  const termSelection = document.getElementById('termSelection');
  termSelection.innerHTML = '';

  if (!terms || terms.length === 0) {
    termSelection.innerHTML = '<p class="error-msg">No terms available.</p>';
    return;
  }

  terms.forEach((term, index) => {
    const label = document.createElement('label');
    label.className = 'term-option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'term';
    radio.value = term.text;
    radio.id = `term-${index}`;

    label.setAttribute('data-id', term.id);
    label.appendChild(radio);
    label.appendChild(document.createTextNode(term.text));
    termSelection.appendChild(label);
  });

  termsFetched = true;
}
