/*
* Ace
*/

var command = ace.edit("command");
command.setOptions({
    maxLines: Infinity
});
command.container.style.lineHeight = 2
command.renderer.updateFontSize()
command.session.setMode("ace/mode/python")
command.session.setUseWrapMode(true);
command.session.setTabSize(4);
command.session.setUseSoftTabs(true);

// auto completion
// https://stackoverflow.com/a/19730470/7037749
command.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: false,
});

command.commands.addCommand({
    name: 'sendCTRLC',
    bindKey: { win: 'Shift-Ctrl-C', mac: 'Ctrl-C' },
    exec: function (command) {
        console.log('sendCTRLC')
        sendCTRLC(command);
    },
});

command.commands.addCommand({
    name: 'sendCTRLD',
    bindKey: { win: 'Shift-Ctrl-D', mac: 'Ctrl-D' },
    exec: function (command) {
        console.log('sendCTRLD')
        sendCTRLD(command);
    },
});

command.commands.addCommand({
    name: 'hist_up',
    bindKey: { win: 'Up', mac: 'Up' },
    exec: function (editor) {
        console.log('hist_up')
        hist_up(editor);
    },
});

command.commands.addCommand({
    name: 'hist_down',
    bindKey: { win: 'Down', mac: 'Down' },
    exec: function (editor) {
        console.log('hist_down')
        hist_down(editor);
    },
});

/*
* Command actions
*/

function run_command() {
    var line = command.getValue().trim();
    if (command.session.getLength() == 1) {
        send_single_line(line);
    } else {
        send_multiple_lines(line);
    }
    command.session.setValue("")
}

/*
* command newline and send
*/

function enter_to_send() {
        command.commands.addCommand({
            name: 'newlineAndIndent',
            bindKey: { win: 'Shift-Enter', mac: 'Shift-Enter' },
            exec: function (command) {
                console.log('newlineAndIndent')
                command.insert("\n");
            },
        });
        command.commands.addCommand({
            name: 'run_command',
            bindKey: { win: 'Enter', mac: 'Enter' },
            exec: function (command) {
                console.log('run_command')
                run_command(command);
            },
        });
    }
    
function senter_to_send () {
    command.commands.addCommand({
        name: 'newlineAndIndent',
        bindKey: { win: 'Enter', mac: 'Enter' },
        exec: function (command) {
            console.log('newlineAndIndent')
            command.insert("\n");
        },
    });
    command.commands.addCommand({
        name: 'run_command',
        bindKey: { win: 'Shift-Enter', mac: 'Shift-Enter' },
        exec: function (command) {
            console.log('run_command')
            run_command(command);
        },
    });
}

function change_send_key() {
    if (enter_to_send) {
        document.getElementById('send_setting').innerHTML = shift_enter_to_send_info;
        enter_to_send = false;
    } else {
        document.getElementById('send_setting').innerHTML = enter_to_send_info;
        enter_to_send = true;
    }
    set_send_key();
}

/*
* Command History related
*/

var cmd_hist = ['print("Hello CircuitPython!")']; // command history
var cmd_ind = -1; // command history index

function push_to_cmd_hist(str) {
    if (str.trim().length != 0) {
        cmd_hist.push(str.trim());
    }
}

var temp_cmd = '';
function hist_up() {
    if (command.getSelectionRange().start.row == 0) {
        if (cmd_ind == -1) {
            cmd_ind = cmd_hist.length - 1
            temp_cmd = command.getValue();
        } else {
            cmd_ind -= 1;
        }
        if (cmd_ind < 0) {
            cmd_ind = 0
        }
        command.session.setValue(cmd_hist[cmd_ind])
        command.gotoLine(0, 0, true)
    } else {
        command.gotoLine(
            command.getSelectionRange().start.row,
            command.getSelectionRange().start.column,
            true,
        )
    }
}

function hist_down() {
    if (command.getSelectionRange().start.row == command.session.getLength() - 1) {
        if (cmd_ind == -1) {
        } else if (cmd_ind == cmd_hist.length - 1) {
            command.session.setValue(temp_cmd);
            cmd_ind = -1;
        } else {
            cmd_ind += 1
            command.session.setValue(cmd_hist[cmd_ind])
        }
        command.gotoLine(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            true,
        )
    } else {
        command.gotoLine(
            command.getSelectionRange().start.row + 2,
            command.getSelectionRange().start.column,
            true,
        )
    }
}

command.session.on('change', serial_fit)

console.log('command.js loaded')