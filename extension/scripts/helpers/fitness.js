/**
 * TODO: 
 * 1. fitness score / reward calculation
 * 2. classes gap
 * 3. day filters
 * 4. time filters
 * 5. instructors filters
 */

export function getFitnessScore(dataset, filters, children, callback) {
    // Setup each filter's weight
    setFilterWeight(filters, children);
    callback(dataset);
}

function setFilterWeight(filters, children) {
    filters.forEach((filter, index) => {
        filter.setAttribute("weight", ((filters.length - index)/summation(filters.length)).toFixed(3)); // normalised weight (descending order due to priority order)
    });

    if(children.length > 0) {
        children.forEach((child, index) => {
            child.setAttribute("weight", ((children.length - index)/summation(children.length)).toFixed(3)); // normalised weight (descending order due to priority order)
        });
    }

    console.log("Filters: ", filters.length);
    console.log("Children: ", children.length);
}
// function setMaxFitness();

// function compareData(dataset, callback)

// function getRawFitness()
// function getFinalFitness()
// function setFitnessScore();

// ------------------------- RESTRICTION FUNCTIONS ---------------------------//
// function getRestrictionDayFilter()
// function getRestrictionTimeFilter()
// function getRestrictionClassGapFilter()
// funciton getRestrictionInstructorFilter()

// ------------------------- HELPER FUNCTIONS ---------------------------//
function summation(n) {
    if(n < 1) return 0; // No natural numbers to sum
    return (n * (n+1)) / 2;
}