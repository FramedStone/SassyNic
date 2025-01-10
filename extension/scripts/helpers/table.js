export function getTable(dataset) {
    let currentCombinationIndex = 0;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    function getTimeRange(timetableData) {
        let earliestStart = 24 * 60; // Start with the latest possible time
        let latestEnd = 0; // Start with the earliest possible time

        timetableData.forEach(course => {
            course.option.classes.forEach(classInfo => {
                classInfo.misc.forEach(misc => {
                    const [start, end] = misc.time.split(' ').map(Number);
                    earliestStart = Math.min(earliestStart, start);
                    latestEnd = Math.max(latestEnd, end);
                });
            });
        });

        // Round down to the nearest hour for start, and up for end
        const startHour = Math.floor(earliestStart / 60);
        const endHour = Math.ceil(latestEnd / 60);

        return { startHour, endHour };
    }

    function formatTime(time) {
        return `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`;
    }

    function getClassesForDay(day, timetableData) {
        const classes = [];

        for (const course of timetableData) {
            for (const classInfo of course.option.classes) {
                for (const misc of classInfo.misc) {
                    if (misc.day === day) {
                        const [start, end] = misc.time.split(' ').map(Number);
                        const startHour = Math.floor(start / 60);
                        const duration = Math.ceil((end - start) / 60);
                        classes.push({ course, classInfo, misc, startHour, duration });
                    }
                }
            }
        }

        return classes.sort((a, b) => a.startHour - b.startHour);
    }

    function createTimetable() {
        const timetableDiv = document.getElementById('frameContainer_timetable');
        // Clear existing content
        timetableDiv.innerHTML = '';

        const { startHour, endHour } = getTimeRange(dataset[currentCombinationIndex]);
        const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

        // Add course options at the top
        const optionsDiv = document.createElement('div');
        const optionsList = document.createElement('ul');
        dataset[currentCombinationIndex].forEach(course => {
            const listItem = document.createElement('li');
            listItem.textContent = `${course.title} - option ${course.option.option}`;
            optionsList.appendChild(listItem);
        });
        optionsDiv.appendChild(optionsList);
        timetableDiv.appendChild(optionsDiv);

        // Create table
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Time</th>' + days.map(day => `<th>${day}</th>`).join('');
        thead.appendChild(headerRow);

        // Create body rows
        for (const hour of hours) {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${formatTime(hour * 60)}</td>`;

            for (const day of days) {
                const dayClasses = getClassesForDay(day, dataset[currentCombinationIndex]);
                const classForThisHour = dayClasses.find(c => c.startHour === hour);

                if (classForThisHour) {
                    const cell = document.createElement('td');
                    cell.className = 'class-cell';
                    cell.setAttribute('rowspan', classForThisHour.duration);
                    
                    const classTextMatch = classForThisHour.classInfo.classText.match(/(LEC|LAB|TUT).*Class Sect\s+(\w+)/);
                    const classType = classTextMatch ? classTextMatch[1] : '';
                    const classSection = classTextMatch ? classTextMatch[2] : '';
                    
                    cell.innerHTML = `
                        <strong>${classForThisHour.course.title}</strong><br>
                        <strong>${classForThisHour.course.code}</strong><br>
                        ${classType} ${classSection}<br>
                        ${classForThisHour.misc.room}<br>
                        ${formatTime(classForThisHour.misc.time.split(' ')[0])} - ${formatTime(classForThisHour.misc.time.split(' ')[1])}<br>
                        ${classForThisHour.misc.instructor}<br>
                        Seats: ${classForThisHour.classInfo.seats.split(' ')[0]} of ${classForThisHour.classInfo.seats.split(' ')[1]}
                    `;
                    row.appendChild(cell);
                } else {
                    const isPartOfPreviousClass = dayClasses.some(
                        c => hour > c.startHour && hour < c.startHour + c.duration
                    );
                    if (!isPartOfPreviousClass) {
                        row.innerHTML += '<td></td>';
                    }
                }
            }

            tbody.appendChild(row);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        timetableDiv.appendChild(table);

        // Add timetable combination index
        const indexDiv = document.createElement('div');
        indexDiv.textContent = `${currentCombinationIndex + 1}/${dataset.length}`;
        timetableDiv.appendChild(indexDiv);
    }

    function navigate(direction) {
        currentCombinationIndex += direction;
        if (currentCombinationIndex < 0) {
            currentCombinationIndex = 0;
        } else if (currentCombinationIndex >= dataset.length) {
            currentCombinationIndex = dataset.length - 1;
        }
        updateButtonStates();
        createTimetable();
    }

    function updateButtonStates() {
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        btnPrev.disabled = currentCombinationIndex === 0;
        btnNext.disabled = currentCombinationIndex === dataset.length - 1;
    }

    // Initialize the timetable
    createTimetable();
    updateButtonStates();

    // Add event listeners for navigation buttons
    document.getElementById('btnPrev').addEventListener('click', () => navigate(-1));
    document.getElementById('btnNext').addEventListener('click', () => navigate(1));
}