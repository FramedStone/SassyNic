/**
 * Function that will determine whether daytime is conflicting
 * @param {String} eDay - Existing Day
 * @param {String} nDay - New Day
 * @param {String} eTime - Existing Time
 * @param {String} nTime - New Time
 * @returns
 */
export function isDayTimeConflict(eDay, nDay, eTime, nTime) {
  if (eDay === nDay) {
    if (eTime === 'to be announced' || nTime === 'to be announced') return true;

    // Parse time into 'start, end'
    const [eStart, eEnd] = eTime.split(' ').map(Number);
    const [nStart, nEnd] = nTime.split(' ').map(Number);

    if (nEnd > eStart && nStart < eEnd) {
      return true; // conflict
    }
  }
  return false;
}

/**
 * Function that will check for seats availability
 * @param {String} seats
 * @returns
 */
export function isSeatsAvailable(seats) {
  const [aSeat, tSeat] = seats.split(' ').map(Number);
  if (aSeat == 0) {
    return false;
  }

  return true;
}

/**
 * Function that will check for any entity that contains empty string or 'to be announced'
 * @param {Object} schedule
 * @returns {Object} - pruned schedule dataset
 */
function isTBA(schedule) {
  for (let data of schedule) {
    for (let cClass of data.option.classes) {
      if (!cClass.seats || cClass.seats.toLowerCase().includes('to be announced')) {
        return true;
      }
      for (let cMisc of cClass.misc) {
        if (!cMisc.day || !cMisc.time || !cMisc.room) {
          return true;
        }
        let lowerCaseVals = [cMisc.day, cMisc.time, cMisc.room].map((v) => v.toLowerCase());
        if (lowerCaseVals.some((v) => v.includes('to be announced'))) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Function that will prune the schedule dataset with applied contraints
 * @param {Object} schedule
 * @returns {Object} - pruned schedule dataset
 */
export function pruneSchedule(schedule) {
  if (isTBA(schedule)) {
    return true;
  }
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const currentOption = schedule[i];
      const nextOption = schedule[j];

      for (let cClass of currentOption.option.classes) {
        // Check seats availability
        if (!isSeatsAvailable(cClass.seats)) {
          return true;
        }
        for (let cMisc of cClass.misc) {
          for (let nClass of nextOption.option.classes) {
            for (let nMisc of nClass.misc) {
              if (
                // Check daytime conflict
                isDayTimeConflict(cMisc.day, nMisc.day, cMisc.time, nMisc.time)
              ) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
}
