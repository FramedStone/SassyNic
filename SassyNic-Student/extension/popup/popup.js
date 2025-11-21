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

  const termToExtractDropdown = document.getElementById('termToExtractDropdown');
  termToExtractDropdown.addEventListener('toggle', function() {
    if (termToExtractDropdown.open) {
      loadTermToExtract();
    }
  });

  const plannerDropdown = document.getElementById('plannerDropdown');
  plannerDropdown.addEventListener('toggle', function() {
    if (plannerDropdown.open) {
      loadPlannerOptions();
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'displayCourses') {
    displayCourses(message.dataId, message.courses);
  }
});

function loadPlannerOptions() {
  const dropdownContent = document.getElementById('plannerDropdownContent');
  dropdownContent.innerHTML = '<p>Loading...</p>';

  chrome.runtime.sendMessage({ action: 'fetchPlanner' }, (response) => {
    if (chrome.runtime.lastError) {
      dropdownContent.innerHTML = `<p style="color: red;">Please refresh CLiC page</p>`;
      return;
    }

    if (response?.error) {
      if (response.error === 'NOT_PLANNER_INTERFACE') {
        dropdownContent.innerHTML = `<p style="color: red;">Please navigate to Planner interface</p>`;
      } else {
        dropdownContent.innerHTML = `<p style="color: red;">Please refresh CLiC page</p>`;
      }
      return;
    }

    if (response?.success && response?.elements?.length > 0) {
      dropdownContent.innerHTML = '';
      response.elements.forEach((element) => {
        const option = document.createElement('details');
        option.className = 'dropdown';
        option.setAttribute('data-id', element.id);

        const summary = document.createElement('summary');
        summary.textContent = element.text || `Term ${element.number}`;

        option.appendChild(summary);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'dropdown-content';
        contentDiv.innerHTML = '<p>Loading courses...</p>';
        option.appendChild(contentDiv);

        option.addEventListener('toggle', function() {
          if (option.open) {
            const dataId = option.getAttribute('data-id');
            chrome.runtime.sendMessage({ action: 'fetchPlannerDetail', dataId: dataId });
          }
        });

        dropdownContent.appendChild(option);
      });
    } else {
      dropdownContent.innerHTML = `<p style="color: red;">Please navigate to Planner interface</p>`;
    }
  });
}

function loadTermToExtract() {
  const dropdownContent = document.getElementById('termToExtractDropdownContent');
  dropdownContent.innerHTML = '<p>Loading...</p>';

  chrome.runtime.sendMessage({ action: 'fetchTermToExtract' }, (response) => {
    if (chrome.runtime.lastError) {
      dropdownContent.innerHTML = `<p style="color: red;">Please refresh CLiC page</p>`;
      return;
    }

    if (response?.error) {
      dropdownContent.innerHTML = `<p style="color: red;">Please refresh CLiC page</p>`;
      return;
    }

    if (response?.success && response?.termLinks?.length > 0) {
      dropdownContent.innerHTML = '';
      response.termLinks.forEach((termLink) => {
        const termRow = document.createElement('label');
        termRow.className = 'term-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'termToExtract';
        radio.setAttribute('data-id', termLink.id);

        const termText = document.createElement('span');
        termText.textContent = termLink.text;

        termRow.appendChild(radio);
        termRow.appendChild(termText);
        dropdownContent.appendChild(termRow);
      });
    } else {
      dropdownContent.innerHTML = `<p style="color: red;">Please navigate to Planner interface</p>`;
    }
  });
}

function displayCourses(dataId, courses) {
  const dropdown = document.querySelector(`[data-id="${dataId}"]`);
  if (!dropdown) return;

  const contentDiv = dropdown.querySelector('.dropdown-content');
  if (!contentDiv) return;

  if (courses === 'error') {
    contentDiv.innerHTML = '<p style="color: red;">Please refresh CLiC page</p>';
    return;
  }

  if (!courses || courses.length === 0) {
    contentDiv.innerHTML = '<p>No courses found</p>';
    return;
  }

  contentDiv.innerHTML = '';
  courses.forEach((course) => {
    const courseRow = document.createElement('div');
    courseRow.className = 'course-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('data-id', course.subjCatalogId);

    const courseInfo = document.createElement('div');
    courseInfo.innerHTML = `
      <strong>${course.subjCatalog}</strong><br>
      ${course.className}<br>
      <small>Units: ${course.unitsRange}</small>
    `;

    courseRow.appendChild(checkbox);
    courseRow.appendChild(courseInfo);
    contentDiv.appendChild(courseRow);
  });
}
