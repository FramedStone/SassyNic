/**
 * TODO: 
 * 1. fitness score / reward calculation
 * 2. classes gap
 * 3. day filters
 * 4. time filters
 * 5. instructors filters
 */

export function setFilterWeight(filters) {
    filters.forEach(filter => {
        console.log(filter.id, filter.getAttribute("data-rank"));
    })
}

// export function setFitnessScore

// export function getFitnessScore(dataset, )

// function setMaxFitness()

// function compareData(dataset, callback)

// function getPenaltyDayFilter()
// function getPenaltyTimeFilter()
// function getPenaltyClassGapFilter()
// funciton getPenaltyInstructorFilter()

// function getRawFitness()
// function getFinalFitness()