console.log('extraction.js successfully injected');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkPlannerInterface') {
    try {
      const panelTitle = document.getElementById('PANEL_TITLElbl');
      const isPlannerPage = panelTitle && panelTitle.textContent?.trim() === 'Planner';
      sendResponse({ success: true, exists: isPlannerPage });
    } catch (error) {
      console.error('Error checking planner interface:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  if (message.action === 'extractPlanner') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(message.html, 'application/xml');

      const elements = [];

      const fieldElements = doc.querySelectorAll('FIELD');
      fieldElements.forEach((field) => {
        const cdataContent = field.textContent;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cdataContent;

        const links = tempDiv.querySelectorAll('[id^="SSR_PLNR_FL_WRK_TERM_DETAIL_LINK"]');
        links.forEach((link) => {
          const id = link.id;
          const match = id.match(/SSR_PLNR_FL_WRK_TERM_DETAIL_LINK\$(\d+)/);
          if (match) {
            elements.push({
              id: id,
              number: match[1],
              text: link.textContent?.trim() || `Term ${match[1]}`,
              href: link.getAttribute('href') || '',
            });
          }
        });
      });

      sendResponse({ success: true, elements: elements });
    } catch (error) {
      console.error('Error extracting planner elements:', error);
      sendResponse({ error: error.message });
    }

    return true;
  }

  if (message.action === 'getFormData') {
    try {
      const formData = {};

      const form = document.querySelector('form[name^="win"]');
      if (form) {
        const inputs = form.querySelectorAll('input[type="hidden"]');
        inputs.forEach((input) => {
          formData[input.name] = input.value;
        });
      }

      sendResponse({ success: true, formData: formData });
    } catch (error) {
      console.error('Error getting form data:', error);
      sendResponse({ error: error.message });
    }

    return true;
  }

  if (message.action === 'extractElements') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(message.html, 'application/xml');

      const courses = [];
      const seen = new Set();

      const fieldElements = doc.querySelectorAll('FIELD');
      for (const field of fieldElements) {
        const cdataContent = field.textContent;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cdataContent;

        const subjectElements = tempDiv.querySelectorAll(`[id^="${message.elementIds[0]}$"]`);

        if (subjectElements.length > 0) {
          subjectElements.forEach((element) => {
            const id = element.id;
            const match = id.match(/\$(\d+)$/);
            if (match) {
              const number = match[1];

              if (!seen.has(number)) {
                const subjCatalogId = `${message.elementIds[0]}$${number}`;
                const subjCatalog =
                  tempDiv
                    .querySelector(`#${subjCatalogId.replace('$', '\\$')}`)
                    ?.textContent?.trim() || '';
                const className =
                  tempDiv
                    .querySelector(`#${message.elementIds[1]}\\$${number}`)
                    ?.textContent?.trim() || '';
                const unitsRange =
                  tempDiv
                    .querySelector(`#${message.elementIds[2]}\\$${number}`)
                    ?.textContent?.trim() || '';

                if (subjCatalog) {
                  courses.push({
                    subjCatalogId: subjCatalogId,
                    subjCatalog: subjCatalog,
                    className: className,
                    unitsRange: unitsRange,
                  });
                  seen.add(number);
                }
              }
            }
          });
          break;
        }
      }

      sendResponse({ success: true, courses: courses });
    } catch (error) {
      console.error('Error extracting elements:', error);
      sendResponse({ error: error.message });
    }

    return true;
  }

  if (message.action === 'extractTermLinks') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(message.html, 'application/xml');

      const termLinks = [];
      const seen = new Set();

      const fieldElements = doc.querySelectorAll('FIELD');
      for (const field of fieldElements) {
        const cdataContent = field.textContent;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cdataContent;

        const linkElements = tempDiv.querySelectorAll(`[id^="${message.elementIds[0]}$"]`);

        if (linkElements.length > 0) {
          linkElements.forEach((element) => {
            const id = element.id;
            if (!seen.has(id) && !id.includes('span')) {
              termLinks.push({
                id: id,
                text: element.textContent?.trim() || 'Unknown Term',
              });
              seen.add(id);
            }
          });
        }
      }

      sendResponse({ success: true, termLinks: termLinks });
    } catch (error) {
      console.error('Error extracting term links:', error);
      sendResponse({ error: error.message });
    }

    return true;
  }
});
