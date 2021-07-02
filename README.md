# CircuitPython online IDE
Open the IDE: https://urfdvw.github.io/CircuitPython-online-IDE/

## Why
The goal is to provide a CircuitPython IDE with **Zero-Setup**, that can be helpful for
- anyone that wants to start a project quickly
- people who are working on public computers
- remote education where teachers don't expect students to install anything by themselves

## Features
- Runs on any device with the Chrome browser, including Chromebooks.
- Code editor with Python highlighting
- Auto completion
- Serial communication with the device
- Read-Evaluate-Print loop (REPL)
- Multiple file editing/File tabs
- CircuitPython specific keyword-highlighting

## Workflow (a.k.a. How to use)

*This guide assumed that CircuitPython is already installed. About how to install CircuitPython to supported devices, please check [CircuitPython Website](https://circuitpython.org/downloads).*

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/Z44PD-ZleAU/0.jpg)](https://www.youtube.com/watch?v=Z44PD-ZleAU)
[](https://stackoverflow.com/a/16079387/7037749)

### First of First
- Plugin your CircuitPython supported board, and make sure it shows up as a drive.
    - There should **NOT** be a `.uf2` file in the drive.
        - If so, that means you are in boot mode, where CircuitPython is installed.
        - To exist boot mode, try:
            - clicking the `reset` button on the board
            - Plug and unplug the board
- If there is not a `code.py` or `main.py` file, create one.
    - This file can be downloaded from our IDE by click on `Save as`
- **Open the [CircuitPython online IDE](https://urfdvw.github.io/CircuitPython-online-IDE/). Then connect your CircuitPython supported board by click the `Connect` button**

### File mode
- Once plugin the CircuitPython supported board, the initial mode is 'File mode'.
- To switch back to 'File mode' from 'REPL' mode, Click on the `CTRL-D` button on the UI (or on the keyboard) to send the `0x04` signal to the board. 
- Click on the `Open` button on the UI to open the code file on the CircuitPython supported board.
    - Opening the file will remove everything in the Editor. Click on the `Save as` button to backup the code before opening it if necessary
- After editing, click on `Save and Run` button on the UI or `Ctrl-S` on the keyboard to save the code to the original file.
    - This will trigger the board to reset and start to run the code.
- If necessary, click on the `Save as` button to save the edited code as a separate file
- command box can be used for serial communication in the 'File mode', such as feeding inputs when `input('message')` is used.

### REPL
- Click on the `CTRL-C` button on the UI (or `Shift-Ctrl-C` on the keyboard) to send the `0x03` signal to the board. This will start the REPL mode.
    - You might need to click for more than one time. Stop until you see `>>>` in the terminal
- Write one or multiple lines of code in the command box. Hit `Enter` on the keyboard to run the command
    - When writing multiple lines, use `Shift-Enter` to create a newline 
- In the Editor: write one or multiple lines of code.
    - Hit `Shift-Enter` on the keyboard to run the current line.
        - The cursor will move to the following line, so keep on hitting to run a sequence of lines.
    - Select multiple lines of code, then hit `Shift-Enter` on the keyboard to run the selected code.
    - Hit `Ctrl-Enter` on the keyboard to run the saved current file in REPL.
        - This function is for debugging, because variables remains in REPL after run
        - This cannot replace running the code in 'File mode' because no reset is done between runs, and you may get '(device) is occupied' error.
            - Manually restart REPL if you get such an error.
- In the command box, `Up` and `Down` to recall command history.
- Click on the `Save as` button on the UI to download the code in the Editor as a separate file.
- Click on the `Save log` button on the UI to download the serial conversation log as a text file.

## Keyboard Shortcuts

Editor
- `Shift-Enter` 
    - when no text selected: send the current line to Console
    - when selected text: send the selected text to Console
- `Ctrl-Enter`
    - Run the saved current file in REPL
- `Ctrl-S`: Save opened file, same as [Save and Run] button on UI
- `Ctrl-Space`: Autocompeletion

Console
- `Enter`: send command
- `Shift-Enter`: newline
- `Up` and `Down`: Recall command history
- `Shift-Ctrl-C`: Send `0x03`, same as [Ctrl-C] button on UI
- `Ctrl-D`: Send `0x04`, same as [Ctrl-D] button on UI

## Planned Features
- Serial data plotter

## References
This project is inspired by the following projects. Some codes are copied from them.
- https://github.com/sensebox/circuitpython-web-ide
- https://github.com/Mr-Coxall/CircuitPython-IDE
