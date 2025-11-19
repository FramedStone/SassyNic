document.addEventListener('DOMContentLoaded', function () {
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

  const plannerDropdown = document.getElementById('plannerDropdown');
  plannerDropdown.addEventListener('toggle', function () {
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
    if (response?.error) {
      dropdownContent.innerHTML = `<p>Error: ${response.error}</p>`;
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

        option.addEventListener('toggle', function () {
          if (option.open) {
            const dataId = option.getAttribute('data-id');
            chrome.runtime.sendMessage({ action: 'fetchPlannerDetail', dataId: dataId });
          }
        });

        dropdownContent.appendChild(option);
      });
    } else {
      dropdownContent.innerHTML = '<p>No planner terms found</p>';
    }
  });
}

function displayCourses(dataId, courses) {
  const dropdown = document.querySelector(`[data-id="${dataId}"]`);
  if (!dropdown) return;

  const contentDiv = dropdown.querySelector('.dropdown-content');
  if (!contentDiv) return;

  if (!courses || courses.length === 0) {
    contentDiv.innerHTML = '<p>No courses found</p>';
    return;
  }

  contentDiv.innerHTML = '';
  courses.forEach((course) => {
    const courseRow = document.createElement('div');
    courseRow.style.padding = '5px';
    courseRow.style.borderBottom = '1px solid #eee';
    courseRow.style.display = 'flex';
    courseRow.style.alignItems = 'center';
    courseRow.style.gap = '10px';

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
