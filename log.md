# 20210621
- Add feature
    - `Up` and `Down` in command to recall history cammand
# 20210621
- Add document
    - Keyboard shortcut section
- Add feature
    - Keyboard shortcut `Ctrl-C` and `Ctrl-D` in Console
# 20210622
- Feature fix
    - Problem: if file too long, `Ctrl-Enter` to send all code to REPL will explode RAM on M0 chips
    - Fix: use `from main import *`
- Feature remove
    - `Ctrl-Enter` to run selected lines is removed
    - replacement: please use `Shift-Enter` for such propose