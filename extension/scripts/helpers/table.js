export function getTable(dataset) {
    const tbody = document.getElementById("timetable").getElementsByTagName("tbody")[0];
    // timetable.innerHTML = ""; // clear table data

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.textContent = "testing";
    row.append(cell);

    tbody.append(row);
}