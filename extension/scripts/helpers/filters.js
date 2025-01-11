// ---------------------- DAYS OF WEEK------------------------------//
export function getDaysOfWeek() {
    // Days of week checkboxes
    const allday = document.getElementById("allday");
    const monday = document.getElementById("monday");
    const tuesday = document.getElementById("tuesday");
    const wednesday = document.getElementById("wednesday");
    const thursday = document.getElementById("thursday");
    const friday = document.getElementById("friday");
    const saturday = document.getElementById("saturday");
    const sunday = document.getElementById("sunday");

    const weekdays = [monday, tuesday, wednesday, thursday, friday, saturday, sunday]; // group for concise

    // When "All Day" is clicked
    allday.addEventListener("click", () => {
        if (allday.checked) {
            weekdays.forEach(checkbox => {
                checkbox.setAttribute("disabled", "true");
                checkbox.checked = false;
            });
        } else {
            weekdays.forEach(checkbox => {
                checkbox.removeAttribute("disabled");
            });
        }
    });

    // When any weekday checkbox is clicked
    weekdays.forEach(checkbox => {
        checkbox.addEventListener("click", () => {
            // Check if all weekdays are checked
            const allChecked = weekdays.every(checkbox => checkbox.checked);

            if (allChecked) {
                // Enable "All Day" and uncheck all weekdays
                allday.checked = true;
                weekdays.forEach(checkbox => {
                    checkbox.setAttribute("disabled", "true");
                    checkbox.checked = false;
                });
            } else {
                // Uncheck "All Day" if not all weekdays are checked
                allday.checked = false;
            }
        });
    });
}

// ---------------------- TIME ------------------------------------//
// Convert time string (HH:mm) to minutes since midnight
function timeToMinutes(timeStr) {
    if (!timeStr) return 480; // Default to 08:00 if no time provided
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convert minutes since midnight to time string (HH:mm)
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function getTimeSliders() {
    const timeStart = document.getElementById('time-start');
    const timeEnd = document.getElementById('time-end');
    const startSlider = document.createElement('input');
    const endSlider = document.createElement('input');

    const MIN_TIME = 480;  // 08:00 (8 * 60)
    const MAX_TIME = 1320; // 22:00 (22 * 60)
    const INTERVAL = 30; // minutes
    
    // Create and initialize start time slider
    startSlider.type = 'range';
    startSlider.min = MIN_TIME; 
    startSlider.max = MAX_TIME; 
    startSlider.step = INTERVAL; // 30-minute intervals
    startSlider.id = 'time-start-slider';
    startSlider.className = 'time-slider';
    
    // Create and initialize end time slider
    endSlider.type = 'range';
    endSlider.min = MIN_TIME;
    endSlider.max = MAX_TIME;
    endSlider.step = INTERVAL;
    endSlider.id = 'time-end-slider';
    endSlider.className = 'time-slider';
    
    // Insert sliders after time inputs
    timeStart.parentNode.insertBefore(startSlider, timeStart.nextSibling);
    timeEnd.parentNode.insertBefore(endSlider, timeEnd.nextSibling);
    
    // Set default values
    timeStart.value = '08:00';
    timeEnd.value = '18:00';
    startSlider.value = timeToMinutes(timeStart.value);
    endSlider.value = timeToMinutes(timeEnd.value);
    
    // Event listeners for time input changes
    timeStart.addEventListener('change', () => {
        let minutes = timeToMinutes(timeStart.value);
        
        // Enforce min/max constraints
        minutes = Math.max(MIN_TIME, Math.min(MAX_TIME, minutes));
        
        // Ensure start time doesn't exceed end time
        const endMinutes = timeToMinutes(timeEnd.value);
        if (minutes > endMinutes) {
            minutes = endMinutes;
        }
        
        // Update both time input and slider
        timeStart.value = minutesToTime(minutes);
        startSlider.value = minutes;
    });
    
    timeEnd.addEventListener('change', () => {
        let minutes = timeToMinutes(timeEnd.value);
        
        // Enforce min/max constraints
        minutes = Math.max(MIN_TIME, Math.min(MAX_TIME, minutes));
        
        // Ensure end time isn't before start time
        const startMinutes = timeToMinutes(timeStart.value);
        if (minutes < startMinutes) {
            minutes = startMinutes;
        }
        
        // Update both time input and slider
        timeEnd.value = minutesToTime(minutes);
        endSlider.value = minutes;
    });
    
    // Event listeners for slider changes
    startSlider.addEventListener('input', () => {
        const startMinutes = parseInt(startSlider.value);
        const endMinutes = parseInt(endSlider.value);
        
        // Ensure start time doesn't exceed end time
        if (startMinutes > endMinutes) {
            startSlider.value = endMinutes;
        }
        
        timeStart.value = minutesToTime(startSlider.value);
    });
    
    endSlider.addEventListener('input', () => {
        const startMinutes = parseInt(startSlider.value);
        const endMinutes = parseInt(endSlider.value);
        
        // Ensure end time doesn't precede start time
        if (endMinutes < startMinutes) {
            endSlider.value = startMinutes;
        }
        
        timeEnd.value = minutesToTime(endSlider.value);
    });

    // Add input event listeners to enforce min/max on direct input
    timeStart.addEventListener('input', (e) => {
        const inputTime = e.target.value;
        if (inputTime) {
            const minutes = timeToMinutes(inputTime);
            if (minutes < MIN_TIME || minutes > MAX_TIME) {
                e.target.value = minutesToTime(Math.max(MIN_TIME, Math.min(MAX_TIME, minutes)));
            }
        }
    });
    
    timeEnd.addEventListener('input', (e) => {
        const inputTime = e.target.value;
        if (inputTime) {
            const minutes = timeToMinutes(inputTime);
            if (minutes < MIN_TIME || minutes > MAX_TIME) {
                e.target.value = minutesToTime(Math.max(MIN_TIME, Math.min(MAX_TIME, minutes)));
            }
        }
    });
}

// ---------------------- CLASS CLOSENESS ----------------------------//
export function getClassCloseness() {
    // Class closeness slider
    const slider = document.getElementById("class_closeness");
    const output = document.getElementById("class_closeness_value");

    // Update the span value when the slider changes
    slider.addEventListener("input", (event) => {
        output.textContent = event.target.value;
    });

    // Set initial value when the page loads
    output.textContent = slider.value;
}

// ---------------------- INSTRUCTORS -----------------------------//
export function getInstructors(dataset) {
    const instructorContainer = document.getElementById('instructor');
    const uniqueInstructors = new Set();

    // Get each instructor from dataset
    dataset.forEach(course => {
        course.forEach(course_ => {
            course_.option.classes.forEach(classItem => {
                classItem.misc.forEach(misc => {
                    if (misc.instructor) {
                        uniqueInstructors.add(misc.instructor);
                    }
                });
            });
        });
    });

    const rankDisplay = instructorContainer.querySelector('.rank-display');
    instructorContainer.innerHTML = '';
    if (rankDisplay) {
        instructorContainer.appendChild(rankDisplay);
    }

    const initialBreak = document.createElement('br');
    instructorContainer.appendChild(initialBreak);

    const sortedInstructors = Array.from(uniqueInstructors).sort();

    sortedInstructors.forEach((instructor, index) => {
        const instructorDiv = document.createElement('div');
        instructorDiv.className = 'draggable-item-child';
        instructorDiv.setAttribute("data-rank", index + 1); // data-rank

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `instructor_${instructor.replace(/[^a-zA-Z0-9]/g, '_')}`;
        checkbox.value = instructor;

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = instructor;

        const lineBreak = document.createElement('br');

        instructorDiv.appendChild(checkbox);
        instructorDiv.appendChild(label);
        instructorDiv.appendChild(lineBreak);
        instructorContainer.appendChild(instructorDiv);
    });
}
