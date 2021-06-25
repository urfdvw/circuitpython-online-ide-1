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
# 20210623
- Add feature
    - 'Ctrl-/' to toggle Comment
# 20210624
- Clean Up
    - Moved all code to a `code.js` file
    - Reordered the code and add some comment
- Add feature
    - Auto completion by `Ctrl-Space`
    - need more elegant way