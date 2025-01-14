/**
 * TODO: 
 * 1. fitness score / reward calculation
 * 2. classes gap
 * 3. day filters
 * 4. time filters
 * 5. instructors filters
 */

export function getSortedDataset(dataset, filters, children, callback) {
    // Setup each filter's weight
    setFilterWeight(filters, children, (maxFitness) => {
        setMaxFitness(dataset, parseFloat(maxFitness), (dataset_) => {
            dataset = dataset_;
        });
    });

    setFitnessScore(dataset, (dataset_) => {
        dataset = dataset_;
    });
    callback(dataset);
}

/**
 * Function to set each filter's normalized weight
 * @param {NodeList} filters 
 * @param {NodeList} children 
 */
function setFilterWeight(filters, children, callback) {
    let maxFitness = 0;

    filters.forEach((filter, index) => {
        let normalised_weight = ((filters.length - index)/summation(filters.length)); // normalised weight (descending order due to priority order)

        filter.setAttribute("weight", normalised_weight);
        maxFitness += parseFloat(normalised_weight);
    });

    console.log("Filters: ", filters.length);
    console.log("Children: ", children.length);
    console.log("Max Fitness: ", parseFloat(maxFitness));

    callback(maxFitness);
}

/**
 * Function to assign maxFitness into each timetable combinations 
 * @param {Array} dataset 
 * @param {String} maxFitness 
 * @param {*} callback 
 */
function setMaxFitness(dataset, maxFitness, callback) {
    // Assign maxFitness into each combination 
    dataset.forEach(set => {
        set.fitness = maxFitness;
    });

    callback(dataset);
}

function setFitnessScore(dataset, callback) {
    dataset.forEach(set => {
        // Calcualte fitness for enabled filters
        const filters = document.querySelectorAll('div.filters div.draggable-item:not([hidden])');
        filters.forEach(filter => {
            switch(filter.id) {
                case "daysofweek":
                    set.fitness = getDayScore(set);
                    break;
            }
        });
    });

    callback(dataset.sort((a, b) => b.fitness - a.fitness));

}

// ------------------------- FITNESS SCORE FUNCTIONS ---------------------//
function getDayScore(set) {
    // Extract user-selected days and their ranks (weights) from the DOM
    const childrenChecked = document.querySelectorAll(
        'div.draggable-item[id="daysofweek"] div.draggable-item-child input[type="checkbox"]:checked'
    );

    const selectedDays = [];
    let everydaySelected = false;

    childrenChecked.forEach((child) => {
        const rank = parseInt(child.parentElement.getAttribute("data-rank"));
        const dayId = child.id;

        if (dayId === "everyday") {
            everydaySelected = true;
        } else {
            selectedDays.push({ day: dayId.toLowerCase(), weight: 1 / rank }); // Higher rank = lower weight
        }
    });

    // Normalize weights if "Everyday" is not selected
    if (!everydaySelected) {
        const totalWeight = selectedDays.reduce((sum, item) => sum + item.weight, 0);
        selectedDays.forEach((item) => (item.weight /= totalWeight));
    }

    // Helper function to calculate penalty
    function calculatePenalty(timetableDays) {
        let penalty = 0;

        if (everydaySelected) {
            // Penalty for not covering all days
            const coveredDays = new Set(timetableDays).size;
            const totalDays = 7; // Monday to Sunday
            penalty = (totalDays - coveredDays) / totalDays;
        } else {
            // Penalty for violating user preferences
            selectedDays.forEach((pref) => {
                if (timetableDays.includes(pref.day)) {
                    penalty += pref.weight; // Penalty increases based on weight
                }
            });
        }

        return penalty;
    }

    // Helper function to calculate objective
    function calculateObjective(timetableDays) {
        let score = 0;

        if (everydaySelected) {
            // Reward timetables that cover all days
            const coveredDays = new Set(timetableDays).size;
            const totalDays = 7; // Monday to Sunday
            score = coveredDays / totalDays;
        } else {
            // Reward timetables that avoid classes on user-preferred days
            selectedDays.forEach((pref) => {
                if (!timetableDays.includes(pref.day)) {
                    score += pref.weight; // Reward increases based on weight
                }
            });
        }

        return score;
    }

    // Process the dataset to get days of scheduled classes
    const timetableDays = [];
    set.forEach((course) => {
        course.option.classes.forEach((classItem) => {
            classItem.misc.forEach((details) => {
                timetableDays.push(details.day.toLowerCase());
            });
        });
    });

    // Calculate penalty and objective
    const penalty = calculatePenalty(timetableDays);
    const objective = calculateObjective(timetableDays);

    // Final fitness score
    const fitnessScore = objective * (1 - penalty);
    return fitnessScore;
}


// ------------------------- HELPER FUNCTIONS ---------------------------//
function summation(n) {
    if(n < 1) return 0; // No natural numbers to sum
    return (n * (n+1)) / 2;
}