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
    let normalised_weight = (filters.length - index) / summation(filters.length); // normalised weight (descending order due to priority order)

    filter.setAttribute('weight', normalised_weight);
    maxFitness += parseFloat(normalised_weight);
  });

  console.log('Filters: ', filters.length);
  console.log('Children: ', children.length);
  console.log('Max Fitness: ', parseFloat(maxFitness));

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
  dataset.forEach((set) => {
    set.fitness = maxFitness;
  });

  callback(dataset);
}

/**
 * Function to get summation of filters final fitness score
 * @param {Object} dataset
 * @param {*} callback
 */
function setFitnessScore(dataset, callback) {
  // Create a shallow copy of dataset to determine if there's any order changes (for details displaying purpose)
  const originalDataset = [...dataset];

  const filters = document.querySelectorAll('div.filters div.draggable-item:not([hidden])');

  dataset.forEach((set) => {
    let day = 0,
      time = 0,
      classGap = 0,
      instructor = 0;

    // Calculate each filter's fitness
    filters.forEach((filter) => {
      switch (filter.id) {
        case 'daysofweek':
          day = getDayScore(set) * filter.getAttribute('weight');
          break;
        case 'instructor':
          instructor = getInstructorScore(set) * filter.getAttribute('weight');
          break;
        case 'time':
          time = getTimeScore(set) * filter.getAttribute('weight');
          break;
        case 'gap':
          classGap = getClassGapScore(set) * filter.getAttribute('weight');
          break;
      }

      // Assign back to current set
      set.fitness = day + time + classGap + instructor;
    });
  });

  dataset.sort((a, b) => b.fitness - a.fitness);

  callback(dataset);
}

// ------------------------- FITNESS SCORE FUNCTIONS ---------------------//
function getDayScore(set) {
  // Extract user-selected days and determine if "Everyday" is checked
  const childrenChecked = document.querySelectorAll(
    'div.draggable-item[id="daysofweek"] div.draggable-item-child input[type="checkbox"]:checked'
  );

  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const selectedDays = [];
  let everydaySelected = false;

  childrenChecked.forEach((child) => {
    const rank = parseInt(child.parentElement.getAttribute('data-rank'));
    const dayId = child.id;

    if (dayId === 'everyday') {
      everydaySelected = true;
    } else {
      selectedDays.push({ day: dayId.toLowerCase(), rank });
    }
  });

  // If "Everyday" is selected, calculate weights for all days
  let weights = {};
  if (everydaySelected) {
    const ranks = allDays.map((day) => {
      const element = document.querySelector(`div.draggable-item-child input[id="${day}"]`);
      return {
        day,
        rank: element ? parseInt(element.parentElement.getAttribute('data-rank')) : Infinity,
      };
    });
    const totalRank = ranks.reduce((sum, { rank }) => sum + 1 / rank, 0);
    weights = ranks.reduce((acc, { day, rank }) => {
      acc[day] = rank > 0 ? 1 / rank / totalRank : 0; // Normalize weights
      return acc;
    }, {});
  } else {
    // Calculate weights for selected days
    const totalRank = selectedDays.reduce((sum, item) => sum + 1 / item.rank, 0);
    selectedDays.forEach(({ day, rank }) => {
      weights[day] = 1 / rank / totalRank;
    });
  }

  // Calculate the fitness score based on the timetable
  const timetableDays = [];
  set.forEach((course) => {
    course.option.classes.forEach((classItem) => {
      classItem.misc.forEach((details) => {
        timetableDays.push(details.day.toLowerCase());
      });
    });
  });

  // Calculate objective and penalty
  const coveredDays = new Set(timetableDays);
  let objective = 0;
  let penalty = 0;

  if (everydaySelected) {
    // Reward all covered days based on their weights
    allDays.forEach((day) => {
      if (coveredDays.has(day)) {
        objective += weights[day];
      } else {
        penalty += weights[day]; // Penalize missing days
      }
    });
  } else {
    // Reward for avoiding selected days
    selectedDays.forEach(({ day }) => {
      if (!coveredDays.has(day)) {
        objective += weights[day];
      } else {
        penalty += weights[day];
      }
    });
  }

  // Final fitness score
  const fitnessScore = objective * (1 - penalty);
  return fitnessScore;
}

function getTimeScore(set) {
  const dayWeights = {
    Monday: 7,
    Tuesday: 6,
    Wednesday: 5,
    Thursday: 4,
    Friday: 3,
    Saturday: 2,
    Sunday: 1,
  };

  let selectedDays = [];
  let includeEveryday = false;

  // Parse user preferences from span.details-display
  const childrenSpan = document.querySelectorAll(
    'div.draggable-item[id="time"] div.draggable-item-child span.details-display'
  );

  // Parse each span into user preferences for each day
  childrenSpan.forEach((span, index) => {
    let [, day, time] = span.textContent.match(/^(.*?)(Start:.*)$/) || [];

    if (day.trim() === 'Everyday') {
      includeEveryday = true;
      const [, start, end] = time.split(/Start: | End: |\s[^ ]*$/);
      selectedDays.push({
        day: 'Everyday',
        weight: 1, // Placeholder, replaced later for individual days
        earliest: parseTime(start),
        latest: parseTime(end),
      });
      return;
    }

    let [, start, end] = time.split(/Start: | End: |\s[^ ]*$/);
    start = parseTime(start);
    end = parseTime(end);

    // Assign weight based on user ranking
    const weight = (childrenSpan.length - index) / summation(childrenSpan.length); // Higher ranking = higher weight

    selectedDays.push({
      day: day.trim(),
      weight,
      earliest: start,
      latest: end,
    });
  });

  // Handle "Everyday" case
  if (includeEveryday) {
    const daysOfWeek = Object.keys(dayWeights);
    const totalWeight = Object.values(dayWeights).reduce((a, b) => a + b, 0);

    selectedDays = daysOfWeek.map((day) => ({
      day,
      weight: dayWeights[day] / totalWeight, // Use normalized dayWeights
      earliest: selectedDays[0].earliest, // From "Everyday"
      latest: selectedDays[0].latest, // From "Everyday"
    }));
  }

  // Group dataset by day
  const newSet = groupByDay(set);

  // Remap 'newSet' to find the earliest and latest times for each day
  Object.keys(newSet).forEach((day) => {
    const times = newSet[day];
    const earliest = Math.min(...times.map((t) => t.start));
    const latest = Math.max(...times.map((t) => t.end));

    // Update 'newSet' with the remapped structure
    newSet[day] = { earliest, latest };
  });

  // Initialize objective and penalty scores
  let objective = 0,
    penalty = 0;

  // Calculate the objective and penalty for each selected day
  selectedDays.forEach(({ day, weight, earliest: preferredEarliest, latest: preferredLatest }) => {
    if (!newSet[day]) {
      // If the day has no classes, reward with its weight
      objective += weight;
      return;
    }

    const actualEarliest = newSet[day].earliest;
    const actualLatest = newSet[day].latest;

    // Calculate deviations
    const deltaEarly = Math.max(0, preferredEarliest - actualEarliest);
    const deltaLate = Math.max(0, actualLatest - preferredLatest);
    const deltaMax = preferredLatest - preferredEarliest;

    if (deltaEarly > 0 || deltaLate > 0) {
      // Penalty only if the time window is violated
      penalty += weight * (deltaEarly / deltaMax + deltaLate / deltaMax);
    } else {
      // Reward if the classes fall within the preferred time window
      objective += weight;
    }
  });

  // Final fitness score
  const fitnessScore = objective * (1 - penalty);
  return fitnessScore;
}

function getClassGapScore(set) {
  // Define day priorities (Monday = highest, Sunday = lowest)
  const priorities = {
    Monday: 7,
    Tuesday: 6,
    Wednesday: 5,
    Thursday: 4,
    Friday: 3,
    Saturday: 2,
    Sunday: 1,
  };

  // Calculate total priority for normalization
  const totalPriority = Object.values(priorities).reduce((sum, value) => sum + value, 0);

  // Normalize day weights
  const dayWeights = {};
  Object.keys(priorities).forEach((day) => {
    dayWeights[day] = priorities[day] / totalPriority;
  });

  // Parse user preferences from the DOM (assumes user prefers "Everyday")
  const childrenSpan = document.querySelectorAll(
    'div.draggable-item[id="gap"] div.draggable-item-child span.details-display'
  );

  let selectedDays = [];
  childrenSpan.forEach((span) => {
    const text = span.textContent.trim();
    if (text.includes('Everyday')) {
      // Apply "Everyday" to all days with the same gap
      const gap = parseInt(text.match(/Gap:\s*(\d+)\s*minutes/i)?.[1]);
      if (gap) {
        Object.keys(priorities).forEach((day) => {
          selectedDays.push({ day, gap });
        });
      }
    } else {
      const [, day, gapText] = text.match(/^(.*?)(Gap:.*)$/) || [];
      if (day && gapText) {
        const gap = parseInt(gapText.replace('Gap:', '').trim());
        selectedDays.push({ day: day.trim(), gap });
      }
    }
  });

  // Group dataset by day
  const newSet = groupByDay(set);

  let totalFitnessScore = 0;

  selectedDays.forEach(({ day, gap: preferredGap }) => {
    const classes = newSet[day];
    const dayWeight = dayWeights[day] || 0; // Default weight = 0 if not in priorities

    if (!classes || classes.length === 0) {
      return; // No classes on this day; skip
    }

    if (classes.length === 1) {
      // Reward single class days with day weight
      totalFitnessScore += dayWeight;
      return;
    }

    // Calculate gaps between classes
    const classTimes = classes.map((cls) => cls.start).sort((a, b) => a - b);

    const gaps = [];
    for (let i = 1; i < classTimes.length; i++) {
      gaps.push(classTimes[i] - classTimes[i - 1]);
    }

    // Calculate penalties for deviations from preferred gap
    let dayPenalty = 0;

    gaps.forEach((actualGap) => {
      const deviation = Math.abs(actualGap - preferredGap);
      dayPenalty += (deviation / preferredGap) * dayWeight;
    });

    // Subtract penalties from the total fitness score
    totalFitnessScore -= dayPenalty;
  });

  return totalFitnessScore;
}

function getInstructorScore(set) {
  const childrenChecked = document.querySelectorAll(
    'div.draggable-item[id="instructor"] div.draggable-item-child input[type="checkbox"]:checked'
  );
  const selectedInstructor = [];
  let uniqueInstructor = new Set(); // to prevent over rewarding / penalty

  // Setup weights
  childrenChecked.forEach((child, index) => {
    const instructor = child.value;

    selectedInstructor.push({
      instructor: instructor,
      weight: (childrenChecked.length - index) / summation(childrenChecked.length),
    }); // Higher ranking = higher weight
  });

  let objective = 0,
    penalty = 0;
  // penalty
  set.forEach((courses) => {
    courses.option.classes.forEach((class_) => {
      class_.misc.forEach((details) => {
        if (
          !uniqueInstructor.has(details.instructor) &&
          selectedInstructor.some((instructor) => instructor.instructor === details.instructor)
        ) {
          uniqueInstructor.add(details.instructor);

          let weight = selectedInstructor.find(
            (instructor) => instructor.instructor === details.instructor
          ).weight;
          penalty += weight;

          let index = selectedInstructor.findIndex(
            (instructor) => instructor.instructor === details.instructor
          );
          selectedInstructor.splice(index, 1)[0];
        }
      });
    });
  });

  // objective / reward
  if (selectedInstructor.length > 0) {
    selectedInstructor.forEach((instructor) => {
      objective += instructor.weight;
    });
  }

  // Final fitness score
  const fitnessScore = objective * (1 - penalty);
  return fitnessScore;
}

// ------------------------- HELPER FUNCTIONS ---------------------------//
/**
 * Function that will return summation of 'n'
 * @param {Number} n  - positive natural number
 * @returns {Number} - summation of 'n'
 */
function summation(n) {
  if (n < 1) return 0; // No natural numbers to sum
  return (n * (n + 1)) / 2;
}

/**
 * Helper function to convert 24 hours time format into minutes format
 * @param {String} time - time in 24 hours format
 * @returns {Integer} -time in minutes
 */
function parseTime(time) {
  let [hour, minute] = time.split(':');
  if (hour === 24)
    // edge case (24:00)
    hour = 0;

  return parseInt(hour) * 60 + (parseInt(minute) || 0);
}

/**
 * Function that will return the set regrouped by by with sorted time
 * @param {Object} set - set's object
 * @returns {Object} - set regrouped by day and sorted by time
 */
function groupByDay(set) {
  const newSet = {};

  // Each courses
  set.forEach((courses) => {
    // Each classes
    courses.option.classes.forEach((class_) => {
      // Each class details
      class_.misc.forEach((details) => {
        const day = details.day;
        const [start, end] = details.time.split(' ').map(Number); // ex: time: 480 540

        if (!newSet[day]) newSet[day] = [];

        newSet[day].push({ start: start, end: end });
      });
    });
  });

  // Sort times for each day
  Object.keys(newSet).forEach((day) => {
    newSet[day].sort((a, b) => a.start - b.start);
  });

  return newSet;
}
