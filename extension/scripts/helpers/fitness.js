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

    getRawFitness(dataset, (dataset_) => {
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

    if(children.length > 0) {
        children.forEach((child, index) => {
            let normalised_weight = ((children.length - index)/summation(children.length)); // normalised weight (descending order due to priority order)

            child.setAttribute("weight", normalised_weight); 
        });
    }

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

function getRawFitness(dataset, callback) {
    dataset.forEach(set => {
        // Calcualte fitness for enabled filters
        const filters = document.querySelectorAll('div.filters div.draggable-item:not([hidden])');
        filters.forEach(filter => {
            switch(filter.id) {
                case "daysofweek":
                    set.fitness = parseFloat(getObjectiveDayFilter(set)) * filter.getAttribute("weight") * getRestrictionDayFilter(set);
                    break;
            }
        });
    });

    callback(dataset.sort((a, b) => b.fitness - a.fitness));

}
// function getFinalFitness()
// function setFitnessScore()

// ------------------------- OBJECTIVES FUNCTIONS ----------------------------//
function getObjectiveDayFilter(set) { 
    const children = document.querySelectorAll('div.draggable-item:not([hidden]) div.draggable-item-child:not([hidden])');

    let score = 0;
    let child_weight = [];
    let uniqueDay = new Set(); // to prevent multiple reward 

    // Setup weight
    children.forEach(child => {
        let checkbox = child.children[0];
        let day = child.children[1];

        if(!checkbox.checked) 
            child_weight.push({day: day.textContent, weight: child.getAttribute("weight")});

    });

    // Compare and find valid set
    set.forEach(courses => {
        courses.option.classes.forEach(class_ => {
            class_.misc.forEach(details => {
                if(!uniqueDay.has(details.day) && child_weight.find(d => d.day === details.day)) {
                    uniqueDay.add(details.day);
                    let weight = child_weight.find(d => d.day === details.day).weight;

                    score += parseFloat(weight);
                }
            });
        });
    });

    return score;
}
// function getObjectiveTimeFilter()
// function getObjectiveClassGapFilter()
// funciton getObjectiveInstructorFilter()

// ------------------------- RESTRICTIONS FUNCTIONS ----------------------//
function getRestrictionDayFilter(set) { 
    const children = document.querySelectorAll('div.draggable-item:not([hidden]) div.draggable-item-child:not([hidden])');

    let valid = 1;
    let child_weight = [];
    let uniqueDay = new Set(); 

    // Setup weight
    children.forEach(child => {
        let checkbox = child.children[0];
        let day = child.children[1];

        if(checkbox.checked) 
            child_weight.push({day: day.textContent, weight: child.getAttribute("weight")});

    });

    // Compare and find invalid set
    set.forEach(courses => {
        courses.option.classes.forEach(class_ => {
            class_.misc.forEach(details => {
                if(!uniqueDay.has(details.day) && child_weight.find(d => d.day === details.day)) {
                    uniqueDay.add(details.day);

                    valid--;
                } 
            });
        });
    });

    return(valid === 1 ? 1 : 0);
}

// ------------------------- HELPER FUNCTIONS ---------------------------//
function summation(n) {
    if(n < 1) return 0; // No natural numbers to sum
    return (n * (n+1)) / 2;
}