/**
 * Function that will determine whether daytime is conflicting 
 * @param {String} eDay - Existing Day 
 * @param {String} nDay - New Day
 * @param {String} eTime - Existing Time
 * @param {String} nTime - New Time
 * @returns 
 */
export function isDayTimeConflict(eDay, nDay, eTime, nTime) {
    if(eDay === nDay) {
        if(eTime || nTime === "to be announced") return true;

        // Parse time into 'start, end'
        const [eStart, eEnd] = eTime.split(' ').map(Number);
        const [nStart, nEnd] = nTime.split(' ').map(Number);

        if(nEnd > eStart && nStart < eEnd) {
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
    if(aSeat == 0) {
        return false;
    }

    return true;
}

/**
 * 
 * @param {Object} schedule 
 * @returns 
 */
export function hasScheduleConflict(schedule) {
    for (let i = 0; i < schedule.length; i++) {
        for (let j = i + 1; j < schedule.length; j++) {
            const currentOption = schedule[i];
            const nextOption = schedule[j];

            for (let cClass of currentOption.option.classes) {
                // Check seats availability
                if(!isSeatsAvailable(cClass.seats)) {
                    return true;
                }
                for (let cMisc of cClass.misc) {
                    for (let nClass of nextOption.option.classes) {
                        for (let nMisc of nClass.misc) {
                            if (
                                // Check daytime conflict
                                isDayTimeConflict(
                                    cMisc.day,
                                    nMisc.day,
                                    cMisc.time,
                                    nMisc.time
                                )
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