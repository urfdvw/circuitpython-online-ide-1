# CircuitPython online IDE
Open the IDE: https://urfdvw.github.io/CircuitPython-online-IDE/

## Motivation
The goal is to build a remote educational platform that allows **Zero-setup** for CircuitPython projects.

In STEM education practices, we found out the most challenging part is usually not the content itself but the setup of the coding environment. In some cases, to set up the environment for entry-level coding projects, advanced operating system and network knowledge are required. This is not a problem in labs because the teacher can set up lab computers in advance. But it not possible in remote education. In such cases, you can never expect the students to set up the environment by themselves. Plus, Chromebooks are usually the only devices they have. In a nutshell, **Zero-setup** is the must-have feature for remote STEM education.

[CircuitPython](https://circuitpython.org/) by Adafruit is very close. Once CircuitPython is installed on supported boards, the only thing a student needs to start a project is a text editor, which satisfies the "Zero-setup" requirement, considering almost all OSes comes with a text editor. However. that means no syntax highlighting, no serial communication for result and debugging, and no IDLE. These features are usually provided by installing the Mu Editor, but that is exactly the way we want to avoid.

So I started this repository, filling the gap with a web-based online IDE that runs on any device with the Chrome browser, including Chromebooks. I will also provide other helpful features needed for entry to medium-level CircuitPython projects.

As an educator, I also want to include remote education tools in this IDE, which can assist the teacher in helping the student. This IDE will help students and educators alike.

## Plan
- Short-term goal (Done): A complete CircuitPython IDE By Github page including
    - Text editor with Python highlighting
    - Loading from and saving to the `main.py` file
    - Serial communication with the device
        - To see the output from `print()` and system error message
- Mid-term goal: A fullfledged website by Django that supports
    - Accounts
        - store code online
        - manage code by project
    - Classrooms
        - group student accounts by classes
        - teacher-student co-operative editing
        - class content management
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
