---
mode: 'ask'
---
Your goal is to generate a new filter component and include the Fitness Function based on requirements.

Ask for the filter name, logic and Fitness Function logic (Objective & Penalty Functions) if not provided.
Ask for 'Inclusive' or 'Exclusive' filter if not provided.
Ask if the new filter should be based on 'daysofweek' if not provided.

Requirements for the filter:
- Mimic the html component based on the filter logic and requirements: [extension/timetable/timetable.html] (../../timetable/timetable.html)
- The filter component must be using the class 'draggable-item gap' & 'rank-display', the 'data-rank' must be following to the latest.
- If the filter component is based on 'daysofweek' it should be using this checkboxes code segment (where the daysofweek ranking fitness scores should always be 'n > n + 1', 1 = highest ranking):
    ```html
    <select id="[filterName]_daysofweek">
        <option id="[filterName]_everyday">Everyday</option>
        <option id="[filterName]_monday">Monday</option>
        <option id="[filterName]_tuesday">Tuesday</option>
        <option id="[filterName]_wednesday">Wednesday</option>
        <option id="[filterName]_thursday">Thursday</option>
        <option id="[filterName]_friday">Friday</option>
        <option id="[filterName]_saturday">Saturday</option>
        <option id="[filterName]_sunday">Sunday</option>
    </select>
    ```
- This is an example array of the dataset format to help you better craft the new filter:
    ```json
    [
        [
            {
                "title": "BAHASA KEBANGSAAN A",
                "code": "LM PU3212",
                "option": {
                    "classes": [
                        {
                            "classText": "Component LEC - Class Sect FC01 - Class",
                            "dates": "11/08/2025 - 02/11/2025",
                            "dayTime": "Thursday<br>8:00AM to 10:00AM",
                            "instructor": "no_instructor_displayed",
                            "misc": [
                                {
                                    "day": "Thursday",
                                    "instructor": "no_instructor_displayed",
                                    "room": "CNMX1005-CLC Lecture Theatre 5",
                                    "time": "480 600"
                                }
                            ],
                            "room": "CNMX1005-CLC Lecture Theatre 5",
                            "seats": "Open Seats 127 of 130"
                        }
                    ],
                    "option": "1",
                    "psc_disabled": "0",
                    "session": "Regular Academic Session",
                    "status": "Open"
                }
            },
            {
                "title": "MOBILE APPLICATION DEVELOPMENT",
                "code": "C IT4173",
                "option": {
                    "classes": [
                        {
                            "classText": "Component LEC - Class Sect TC1L - Class",
                            "dates": "11/08/2025 - 02/11/2025",
                            "dayTime": "Tuesday<br>8:00AM to 10:00AM",
                            "instructor": "no_instructor_displayed",
                            "misc": [
                                {
                                    "day": "Tuesday",
                                    "instructor": "no_instructor_displayed",
                                    "room": "CQAR1006-FCI Tutorial ROOM",
                                    "time": "480 600"
                                }
                            ],
                            "room": "CQAR1006-FCI Tutorial ROOM",
                            "seats": "Open Seats 17 of 40"
                        },
                        {
                            "classText": "Component LAB - Class Sect TL2L - Class",
                            "dates": "",
                            "dayTime": "Thursday<br>2:00PM to 4:00PM",
                            "instructor": "no_instructor_displayed",
                            "misc": [
                                {
                                    "day": "Thursday",
                                    "instructor": "no_instructor_displayed",
                                    "room": "CQAR1006-FCI Tutorial ROOM",
                                    "time": "840 960"
                                }
                            ],
                            "room": "CQAR1006-FCI Tutorial ROOM",
                            "seats": "Open Seats 10 of 20"
                        }
                    ],
                    "option": "1",
                    "psc_disabled": "0",
                    "session": "Regular Academic Session",
                    "status": "Open"
                }
            }
        ],
        [
            {
                "title": "BAHASA KEBANGSAAN A",
                "code": "LM PU3212",
                "option": {
                    "classes": [
                        {
                            "classText": "Component LEC - Class Sect FC01 - Class",
                            "dates": "11/08/2025 - 02/11/2025",
                            "dayTime": "Thursday<br>8:00AM to 10:00AM",
                            "instructor": "no_instructor_displayed",
                            "misc": [
                                {
                                    "day": "Thursday",
                                    "instructor": "no_instructor_displayed",
                                    "room": "CNMX1005-CLC Lecture Theatre 5",
                                    "time": "480 600"
                                }
                            ],
                            "room": "CNMX1005-CLC Lecture Theatre 5",
                            "seats": "Open Seats 127 of 130"
                        }
                    ],
                    "option": "1",
                    "psc_disabled": "0",
                    "session": "Regular Academic Session",
                    "status": "Open"
                }
            },
            {
                "title": "MOBILE APPLICATION DEVELOPMENT",
                "code": "C IT4173",
                "option": {
                    "classes": [
                        {
                            "classText": "Component LEC - Class Sect TC1L - Class",
                            "dates": "11/08/2025 - 02/11/2025",
                            "dayTime": "Tuesday<br>8:00AM to 10:00AM",
                            "instructor": "no_instructor_displayed",
                            "misc": [
                                {
                                    "day": "Tuesday",
                                    "instructor": "no_instructor_displayed",
                                    "room": "CQAR1006-FCI Tutorial ROOM",
                                    "time": "480 600"
                                }
                            ],
                            "room": "CQAR1006-FCI Tutorial ROOM",
                            "seats": "Open Seats 17 of 40"
                        },
                        {
                            "classText": "Component LAB - Class Sect TL1L - Class",
                            "dates": "",
                            "dayTime": "Thursday<br>2:00PM to 4:00PM",
                            "instructor": "no_instructor_displayed",
                            "misc": [
                                {
                                    "day": "Thursday",
                                    "instructor": "no_instructor_displayed",
                                    "room": "CQAR1006-FCI Tutorial ROOM",
                                    "time": "840 960"
                                }
                            ],
                            "room": "CQAR1006-FCI Tutorial ROOM",
                            "seats": "Open Seats 7 of 20"
                        }
                    ],
                    "option": "2",
                    "psc_disabled": "0",
                    "session": "Regular Academic Session",
                    "status": "Open"
                }
            }
        ]
    ]
    ```
- The filter component must be implemented with the Fitness Function by having its own Objective & Penalty Functions (if 
needed) based on filter's logics in: [extension/scripts/helpers/fitness.js] (../../scripts/helpers/fitness.js).
- Add event listener for the new filter component in: [extension/scripts/helpers/filters.js] (../../scripts/helpers/fitness.js).
- Add the new filter's getter function in: [extension/timetable/timetable.js] (../../timetable/timetable.js) and pass in 'dataset' as argument if needed.
