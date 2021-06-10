# CircuitPython online IDE
Open the IDE: https://urfdvw.github.io/CircuitPython-online-IDE/

## Motivation
The goal is to build a remote educational platform that allows **Zero-setup** for CircuitPython projects.

In STEM education practices, we found out the most challenging part is usually not the content itself but the setup of the coding environment. In some cases, to set up the environment for entry-level coding projects, advanced operating system and network knowledge are required. This is not a problem in labs because the teacher can set up lab computers in advance. But this not possible in remote education. In such cases, you can never expect the students to set up the environment by themselves. Plus, usually, Chromebooks are the only devices they have. In a nutshell, **Zero-setup** is the must-have feature for remote STEM education.

CircuitPython by Adafruit is very close. The missing link is a web-based online IDE that is possible to run on any device. 

We also have the perspective to include remote education tools in this project. That can assist the teacher in helping the student.

## Timeline
- Short-term goal (Done): A complete CircuitPython IDE By Github page including
    - Python editor with highlighting
    - Load and save the `main.py` file
    - Serial communication with the device
        - To see the output from `print()` and system error message
- Mid-term goal: A fullfledged website by Django that supports
    - Accounts
        - store code online
        - manage code by project
    - Classrooms
        - group student accounts by classes
        - teacher-student co-operative editing
        - class content manage
- Long term goal: additional features
    - Visual appeal
    - Serial IDLE
    - Serial plotter
    - CircuitPython Documents links
        - Links to the API references
        - Package download links
    - Google integration
        - login by google
        - save projects on google drive
