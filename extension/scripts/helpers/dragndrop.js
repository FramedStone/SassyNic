export function getDragDrop() {
    // Get parent container and all draggable items
    const filters = document.getElementById('filters');
    const draggables = document.querySelectorAll('.draggable-item');

    // Track the currently dragged element
    let draggedItem = null;

    // Add drag event listeners to draggable items
    draggables.forEach(draggable => {
        // Handle mousedown to determine if drag should start
        draggable.addEventListener('mousedown', (e) => {
            // Check if the click target is the slider or its value display
            if (e.target.type === 'range' || e.target.id.includes('_value')) {
                draggable.setAttribute('draggable', 'false');
            } else {
                draggable.setAttribute('draggable', 'true');
            }
        });

        // Reset draggable attribute on mouseup
        draggable.addEventListener('mouseup', () => {
            draggable.setAttribute('draggable', 'true');
        });

        draggable.addEventListener('dragstart', (e) => {
            // Additional check to prevent drag if target is slider
            if (e.target.type === 'range' || e.target.id.includes('_value')) {
                e.preventDefault();
                return;
            }
            draggedItem = draggable;
            draggable.classList.add('dragging');
            e.dataTransfer.effectAllowed = "move";
        });

        draggable.addEventListener('dragend', () => {
            draggedItem = null;
            draggable.classList.remove('dragging');
            updateRanks();
        });
    });

    // Add dragover and drop events to the parent container
    filters.addEventListener('dragover', (e) => {
        e.preventDefault();

        // Get the closest element to the current mouse position
        const afterElement = getDragAfterElement(filters, e.clientX);

        // Insert the dragged element before the found element
        if (afterElement == null) {
            filters.appendChild(draggedItem);
        } else {
            filters.insertBefore(draggedItem, afterElement);
        }
    });

    // Function to determine where to insert the dragged item
    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Function to update rankings dynamically
    function updateRanks() {
        const items = filters.querySelectorAll(".draggable-item");
        items.forEach((item, index) => {
            const rank = index + 1;
            item.dataset.rank = rank; // Update the rank in the dataset
            item.querySelector(".rank-display").textContent = `${rank}. `; // Update visible rank
        });
    }
}