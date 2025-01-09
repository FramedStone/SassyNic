export function getTable(dataset) {
    const frameContainer = document.getElementById("frameContainer");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    let currentFrameIndex = 0;

    // Generate time slots (1-hour intervals)
    const generateTimeslots = () => {
        const startTime = 480; // 8:00 AM in minutes
        const endTime = 1140; // 7:00 PM in minutes
        const interval = 60; // 1 hour
        const timeslots = [];

        for (let time = startTime; time < endTime; time += interval) {
            const hours = Math.floor(time / 60);
            const minutes = time % 60;
            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            timeslots.push(formattedTime);
        }
        return timeslots;
    };

    // Create frames dynamically
    const createFrames = () => {
        const timeslots = generateTimeslots();

        dataset.forEach((data, index) => {
            const frame = document.createElement("div");
            frame.className = "frame";
            if (index === 0) frame.classList.add("active");

            const table = document.createElement("table");
            table.id = "timetable";

            // Create the table header
            const thead = document.createElement("thead");
            thead.innerHTML = `
                <tr>
                    <th>Time</th>
                    <th>Monday</th>
                    <th>Tuesday</th>
                    <th>Wednesday</th>
                    <th>Thursday</th>
                    <th>Friday</th>
                </tr>
            `;
            table.appendChild(thead);

            // Create the table body
            const tbody = document.createElement("tbody");
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            
            /**
             * TODO: If misc.start and misc.end is within current timeslot then put details into it, with time converted back to 24 hours format
             */

            cell.innerHTML = timeslots[0];
            row.appendChild(cell);
            tbody.appendChild(row);

            table.appendChild(tbody);
            frame.appendChild(table);
            frameContainer.appendChild(frame);
        });
    };

    // Update frames based on navigation
    const updateFrames = () => {
        const frames = document.querySelectorAll(".frame");
        frames.forEach((frame, index) => {
            frame.classList.remove("active");
            if (index === currentFrameIndex) frame.classList.add("active");
        });

        btnPrev.disabled = currentFrameIndex === 0;
        btnNext.disabled = currentFrameIndex === dataset.length - 1;
    };

    // Event listeners for navigation buttons
    btnPrev.addEventListener("click", () => {
        if (currentFrameIndex > 0) {
            currentFrameIndex--;
            updateFrames();
        }
    });

    btnNext.addEventListener("click", () => {
        if (currentFrameIndex < dataset.length - 1) {
            currentFrameIndex++;
            updateFrames();
        }
    });

    // Initialize
    createFrames();
    updateFrames();
}