export function getTable(dataset) {
    return new Promise((resolve, reject) => {
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

            // satisfaction indicator
            const satisfaction_div = document.createElement('div');
            const satisfaction_span = document.createElement('span');
            satisfaction_span.id = `satisfaction-${currentCombinationIndex}`;
            const fitness = dataset[currentCombinationIndex].fitness;
            if (fitness === 1) {
                satisfaction_span.innerText = 'Satisfied all current setting(s)';
                satisfaction_span.style.color = 'green';
            } else {
                const fitnessPercentage = (fitness * 100).toFixed(2);
                satisfaction_span.innerHTML = `<strong>${fitnessPercentage}%</strong> close to your current setting(s)`;
                satisfaction_span.style.color = 'red';
            }
            satisfaction_span.style.textAlign = 'center';
            satisfaction_span.style.fontSize = '16px';
            satisfaction_div.appendChild(satisfaction_span);
            timetableDiv.appendChild(satisfaction_div);

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
                            <strong>${formatTime(classForThisHour.misc.time.split(' ')[0])} - ${formatTime(classForThisHour.misc.time.split(' ')[1])}</strong><br>
                            ${classForThisHour.misc.instructor}
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

        function showEnrollmentOptions() {
            // Remove existing modal before creating a new one
            const existingModal = document.getElementById('customModal');
            if(existingModal) {
                existingModal.remove();
            }

            let optionsHTML = '';
            console.log("timetable index: ", currentCombinationIndex);
            dataset[currentCombinationIndex].forEach(course => {
                console.log("enroll modal option: ", course.option.option);
                optionsHTML += `<strong>${course.title} - option ${course.option.option}</strong><br>`;
                course.option.classes.forEach(classInfo => {
                    const classTextMatch = classInfo.classText.match(/(LEC|LAB|TUT).*Class Sect\s+(\w+)/);
                    const classType = classTextMatch ? classTextMatch[1] : '';
                    const classSection = classTextMatch ? classTextMatch[2] : '';
                    optionsHTML += `<div style="padding-left: 20px;">${classType} ${classSection} - Seats: ${classInfo.seats.split(' ')[0]} of ${classInfo.seats.split(' ')[1]}</div>`;
                });
            });

            // Create modal container
            const modalHTML = `
                <div id="customModal" class="modal">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <div class="modal-header">
                            <h2>Course Options</h2>
                        </div>
                        <div class="modal-body">
                            ${optionsHTML}
                        </div>
                        <div class="modal-footer">
                            <button id="btnManualEnroll" disabled>Manual Enroll (m)</button>
                            <button id="btnAutoEnroll" disabled>Auto Enroll (a)</button>
                        </div>
                    </div>
                </div>`;

            // Append modal to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Show modal
            const modal = document.getElementById('customModal');
            modal.style.display = 'block';

            // Close modal
            document.querySelector('.close').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // buttons
            const btnManualEnroll = document.getElementById('btnManualEnroll');
            const btnAutoEnroll = document.getElementById('btnAutoEnroll');

            // Manual Enroll
            btnManualEnroll.addEventListener('click', () => {
                // Play 'Welcome to Gryffindor' soundboard
                const bgm = document.getElementById('backgroundAudio');
                const soundboard = document.getElementById('manual-enroll');
                soundboard.play();
                bgm.pause();
            });

            // Auto Enroll
            btnAutoEnroll.addEventListener('click', () => {
                // Play 'Avada Kedavra' soundboard
                const bgm = document.getElementById('backgroundAudio');
                const soundboard = document.getElementById('auto-enroll');
                soundboard.play();
                bgm.pause();
            });

            // Keyboard event listeners 
            document.addEventListener('keydown', (event) => {
                if(event.key === 'Escape' || event.key === 'Backspace') {
                    modal.style.display = 'none';
                } else if(event.key === 'm') {
                    btnManualEnroll.click();
                } else if(event.key === 'a') {
                    btnAutoEnroll.click();
                }
            });
        }

        // Initialize the timetable
        createTimetable();
        updateButtonStates();

        // Add event listeners for navigation buttons
        document.getElementById('btnPrev').addEventListener('click', () => navigate(-1));
        document.getElementById('btnNext').addEventListener('click', () => navigate(1));
        document.getElementById('btnEnroll').addEventListener('click', showEnrollmentOptions);

        // Keyboard event listeners 
        document.addEventListener('keydown', (event) => {
            if(event.key === 'p' || event.key === 'ArrowLeft') {
                navigate(-1);
            } else if(event.key === 'n' || event.key === 'ArrowRight') {
                navigate(1);
            } else if(event.key === 'e' || event.key == 'Enter') {
                showEnrollmentOptions();
            }
        });

        resolve();
    });
}
