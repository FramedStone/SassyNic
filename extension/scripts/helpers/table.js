export function getTable(timetableCombinations) {
    let currentCombinationIndex = 0;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

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
                const dayClasses = getClassesForDay(day, timetableCombinations[currentCombinationIndex]);
                const classForThisHour = dayClasses.find(c => c.startHour === hour);

                if (classForThisHour) {
                    const cell = document.createElement('td');
                    cell.className = 'class-cell';
                    cell.setAttribute('rowspan', classForThisHour.duration);
                    cell.innerHTML = `
                        <div>${classForThisHour.course.title}</div>
                        <div>${classForThisHour.classInfo.classText}</div>
                    `;
                    // cell.addEventListener('mouseover', (e) => showTooltip(e, classForThisHour));
                    // cell.addEventListener('mouseout', hideTooltip);
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
        timetableDiv.innerHTML = '';
        timetableDiv.appendChild(table);
    }

    // function showTooltip(event, classData) {
    //     const tooltip = document.getElementById('tooltip');
    //     tooltip.innerHTML = `
    //         <p><strong>Course:</strong> ${classData.course.title}</p>
    //         <p><strong>Code:</strong> ${classData.course.code}</p>
    //         <p><strong>Instructor:</strong> ${classData.misc.instructor}</p>
    //         <p><strong>Room:</strong> ${classData.misc.room}</p>
    //         <p><strong>Time:</strong> ${formatTime(classData.startHour * 60)} - ${formatTime((classData.startHour + classData.duration) * 60)}</p>
    //     `;
    //     tooltip.style.display = 'block';
    //     tooltip.style.left = `${event.pageX + 10}px`;
    //     tooltip.style.top = `${event.pageY + 10}px`;
    // }

    // function hideTooltip() {
    //     const tooltip = document.getElementById('tooltip');
    //     tooltip.style.display = 'none';
    // }

    function navigate(direction) {
        currentCombinationIndex += direction;
        if (currentCombinationIndex < 0) {
            currentCombinationIndex = 0;
        } else if (currentCombinationIndex >= timetableCombinations.length) {
            currentCombinationIndex = timetableCombinations.length - 1;
        }
        updateButtonStates();
        createTimetable();
    }

    function updateButtonStates() {
        const prevBtn = document.getElementById('btnPrev');
        const nextBtn = document.getElementById('btnNext');
        prevBtn.disabled = currentCombinationIndex === 0;
        nextBtn.disabled = currentCombinationIndex === timetableCombinations.length - 1;
    }

    // Initialize the timetable
    createTimetable();
    updateButtonStates();

    // Add event listeners for navigation buttons
    document.getElementById('btnPrev').addEventListener('click', () => navigate(-1));
    document.getElementById('btnNext').addEventListener('click', () => navigate(1));
}