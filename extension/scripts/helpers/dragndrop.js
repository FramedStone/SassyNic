export function getDragDrop() {
    // Get parent container and all draggable items
    const filters = document.getElementById('filters');
    const draggables = document.querySelectorAll('.draggable-item:not([hidden])');

    // Track the currently dragged element
    let draggedItem = null;

    // ---------------------- PARENT DIV ----------------------------//
    // Add drag event listeners to draggable items
    draggables.forEach(draggable => {
        // Handle mousedown to determine if drag should start
        draggable.addEventListener('mousedown', (e) => {
            // Enable drag only if the click target is a span
            if (e.target.tagName === 'SPAN') {
                draggable.setAttribute('draggable', 'true');
            } else {
                draggable.setAttribute('draggable', 'false');
            }
        });

        // Reset draggable attribute on mouseup
        draggable.addEventListener('mouseup', () => {
            draggable.setAttribute('draggable', 'true');
        });

        draggable.addEventListener('dragstart', (e) => {
            if (!draggable.getAttribute('draggable')) return; // Prevent drag if draggable is false
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

        // Ensure draggedItem is a valid Node
        if (!draggedItem || !(draggedItem instanceof Node)) {
            return;
        }

        // Get the closest element to the current mouse position
        const afterElement = getDragAfterElement(filters, e.clientX);

        // Insert the dragged element before the found element
        if (afterElement == null) {
            filters.appendChild(draggedItem);
        } else {
            filters.insertBefore(draggedItem, afterElement);
        }
    });

    // ---------------------- CHILD DIV ----------------------------//
    const childContainers = document.querySelectorAll('.draggable-item-child');

    childContainers.forEach(child => {
        child.addEventListener('mousedown', (e) => {
            // Enable drag only if the click target is a label
            if (e.target.tagName === 'LABEL') {
                child.setAttribute('draggable', 'true');
            } else {
                child.setAttribute('draggable', 'false');
            }
        });

        child.addEventListener('dragstart', (e) => {
            if (!child.getAttribute('draggable')) return;
            draggedItem = child;
            child.classList.add('dragging-child');
            e.dataTransfer.effectAllowed = "move";
        });

        child.addEventListener('dragend', () => {
            draggedItem = null;
            child.classList.remove('dragging-child');
            updateChildRanks(child.parentElement); // Update the rank for the parent container
        });

        child.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingChild = document.querySelector('.dragging-child');
            
            if (draggingChild) {
                const afterElement = getDragAfterElement(child.parentElement, e.clientY, '.draggable-item-child');
                if (afterElement == null) {
                    child.parentElement.appendChild(draggingChild);
                } else {
                    child.parentElement.insertBefore(draggingChild, afterElement);
                }
            }
        });
    });

    // ---------------------- UTILITY FUNCTIONS ----------------------------//
    // Function to determine where to insert the dragged item
    function getDragAfterElement(container, position, selector = '.draggable-item') {
        const draggableElements = [...container.querySelectorAll(`${selector}:not(.dragging):not(.dragging-child)`)];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = position - (selector === '.draggable-item' ? box.right: box.bottom);

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Function to update rankings dynamically for parent items
    function updateRanks() {
        const items = filters.querySelectorAll(".draggable-item:not([hidden])");
        items.forEach((item, index) => {
            const rank = index + 1;
            const currentRank = parseInt(item.dataset.rank) || 0;

            // Only update if the rank has changed
            if (currentRank !== rank) {
                const originalText = item.querySelector('span').textContent.replace(/\d+\./, '').trim();
                item.dataset.rank = rank;
                item.querySelector(".rank-display").textContent = `${rank}. ${originalText}`;
            }
        });
    }

    // Function to update rankings dynamically for child items
    function updateChildRanks(parent) {
        const children = parent.querySelectorAll(".draggable-item-child");
        children.forEach((child, index) => {
            const newRank = index + 1;
            const currentRank = parseInt(child.dataset.rank) || 0;

            // Only update if the rank has changed
            if (currentRank !== newRank) {
                child.dataset.rank = newRank;
            }
        });
    }
    updateRanks();
}
