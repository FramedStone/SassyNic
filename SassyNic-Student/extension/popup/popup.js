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

  document.getElementById('btnGenerateTimetable').addEventListener('click', () => {
    handleGenerateTimetable();
  });

  const termToExtractDropdown = document.getElementById('termToExtractDropdown');
  termToExtractDropdown.addEventListener('toggle', function () {
    if (termToExtractDropdown.open) {
      loadTermToExtract();
    }
  });

  const plannerDropdown = document.getElementById('plannerDropdown');
  plannerDropdown.addEventListener('toggle', function () {
    if (plannerDropdown.open) {
      loadPlannerOptions();
    }
  });

  const enrollByRequirementsDropdown = document.getElementById('enrollByRequirementsDropdown');
  enrollByRequirementsDropdown.addEventListener('toggle', function () {
    if (enrollByRequirementsDropdown.open) {
      loadEnrollByRequirements();
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'displayCourses') {
    displayCourses(message.dataId, message.courses);
  }

  if (message.action === 'displayCourseGridRows') {
    displayCourseGridRows(message.requirementId, message.requirementText, message.courseRows);
  }

  if (message.action === 'requirementsProcessingComplete') {
    const dropdownContent = document.getElementById('enrollByRequirementsDropdownContent');
    const existingMessage = dropdownContent.querySelector('p');
    if (existingMessage && existingMessage.textContent.includes('Loading')) {
      existingMessage.textContent = `Completed processing ${message.totalCount} requirement(s)`;
      existingMessage.style.color = 'green';
    }
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
        dropdownContent.innerHTML = `<p style="color: red;">Please navigate to Planner interface, don't click into any of the term</p>`;
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

        option.addEventListener('toggle', function () {
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

function loadEnrollByRequirements() {
  const dropdownContent = document.getElementById('enrollByRequirementsDropdownContent');
  dropdownContent.innerHTML = '<p>Loading requirements...</p>';

  chrome.runtime.sendMessage({ action: 'fetchEnrollByRequirements' }, (response) => {
    if (chrome.runtime.lastError) {
      dropdownContent.innerHTML = `<p style="color: red;">Please refresh CLiC page</p>`;
      return;
    }

    if (response?.error) {
      if (response.error === 'NOT_ENROLL_BY_REQUIREMENT_INTERFACE') {
        dropdownContent.innerHTML = `<p style="color: red;">Please navigate to Enroll by My Requirement interface, do not click into any terms</p>`;
      } else {
        dropdownContent.innerHTML = `<p style="color: red;">${response.error}</p>`;
      }
      return;
    }

    if (response?.success) {
      dropdownContent.innerHTML = `<p style="color: blue;">Loading ${response.count} requirement(s)...</p>`;
    } else {
      dropdownContent.innerHTML = `<p style="color: red;">Failed to load requirements</p>`;
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

function displayCourseGridRows(requirementId, requirementText, courseRows) {
  console.log(`displayCourseGridRows called for ${requirementId}:`, courseRows);

  const dropdownContent = document.getElementById('enrollByRequirementsDropdownContent');

  if (!courseRows || courseRows.length === 0) {
    console.log('No course rows found for requirement:', requirementId);
    return;
  }

  if (dropdownContent.querySelector('p')) {
    dropdownContent.innerHTML = '';
  }

  const coursesByNff = {};
  courseRows.forEach((row) => {
    if (!coursesByNff[row.nffNumber]) {
      coursesByNff[row.nffNumber] = [];
    }
    coursesByNff[row.nffNumber].push(row);
  });

  Object.entries(coursesByNff).forEach(([nffNumber, courses]) => {
    const groupKey = `${requirementText}_${nffNumber}`;
    let requirementDropdown = dropdownContent.querySelector(`[data-group-key="${groupKey}"]`);
    let contentDiv;

    if (requirementDropdown) {
      contentDiv = requirementDropdown.querySelector('.dropdown-content');
    } else {
      requirementDropdown = document.createElement('details');
      requirementDropdown.className = 'dropdown';
      requirementDropdown.setAttribute('data-group-key', groupKey);
      requirementDropdown.setAttribute('data-nff-number', nffNumber);

      const summary = document.createElement('summary');
      summary.textContent = requirementText;
      requirementDropdown.appendChild(summary);

      contentDiv = document.createElement('div');
      contentDiv.className = 'dropdown-content';
      requirementDropdown.appendChild(contentDiv);

      dropdownContent.appendChild(requirementDropdown);
    }

    courses.forEach((row) => {
      const courseRow = document.createElement('div');
      courseRow.className = 'course-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('data-id', row.id);

      const courseInfo = document.createElement('div');
      courseInfo.innerHTML = `
      <strong>${row.courseName}</strong><br>
      ${row.courseDescription}
    `;

      courseRow.appendChild(checkbox);
      courseRow.appendChild(courseInfo);
      contentDiv.appendChild(courseRow);
    });
  });
}

function handleGenerateTimetable() {
  console.log('Requesting timetable generation...');

  chrome.runtime.sendMessage({ action: 'generateTimetable' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError.message);
      alert(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }

    if (response?.error) {
      console.error('Error generating timetable:', response.error);
      alert(`Error generating timetable: ${response.error}`);
    } else if (response?.success) {
      alert('Timetable generation successful! Check background console for response.');
    }
  });
}
