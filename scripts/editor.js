ace.require("ace/ext/language_tools");
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/python");
editor.session.setTabSize(4);
editor.session.setUseSoftTabs(true);
editor.session.setUseWrapMode(true);
editor.session.setValue(`# Click on a file or a tab to start coding.`)
const scratch_session = editor.getSession();

editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
});

// https://stackoverflow.com/a/42930077/7037749
editor.commands.on("exec", function(e) { 
    if (current_ind === undefined) {
        e.preventDefault();
        e.stopPropagation();
    }
});

editor.commands.addCommand({
    name: 'run_current',
    bindKey: { win: 'Shift-Enter', mac: 'Shift-Enter' },
    exec: function (editor) {
        console.log('run_current')
        run_current(editor);
    },
});

editor.commands.addCommand({
    name: 'run_cell',
    bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
    exec: function (editor) {
        console.log('run_cell')
        run_cell(editor);
    },
});

editor.commands.addCommand({
    name: 'run_current_and_del',
    bindKey: { win: 'Alt-Enter', mac: 'Alt-Enter' },
    exec: function (editor) {
        console.log('run_current_and_del')
        run_current_and_del(editor);
    },
});

editor.commands.addCommand({
    name: 'append_command_to_editor',
    bindKey: { win: 'Shift-Alt-Enter', mac: 'Shift-Alt-Enter' },
    exec: function (editor) {
        console.log('append_command_to_editor')
        append_command_to_editor(editor);
    },
});

editor.commands.addCommand({
    name: 'myCommand',
    bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
    exec: function(editor) {
        save_only(editor);
    },
});

editor.commands.addCommand({
    name: 'MyOutdent',
    bindKey: { win: 'Ctrl-[', mac: 'Cmd-[' },
    exec: function (editor) {
        console.log('MyOutdent')
        editor.blockOutdent();
    },
    multiSelectAction: "forEach",
    scrollIntoView: "selectionPart"
});

editor.commands.addCommand({
    name: 'MyIntdent',
    bindKey: { win: 'Ctrl-]', mac: 'Cmd-]' },
    exec: function (editor) {
        console.log('MyIntdent')
        editor.blockIndent();
    },
    multiSelectAction: "forEach",
    scrollIntoView: "selectionPart"
});

var chromeOS = /(CrOS)/.test(navigator.userAgent);
var hist_up_key = '';
var hist_down_key = '';
if (chromeOS) {
    hist_up_key = 'Alt-,';
    hist_down_key = 'Alt-.';
} else {
    hist_up_key = 'Alt-Up';
    hist_down_key = 'Alt-Down';
}

editor.commands.addCommand({
    name: 'hist_up',
    bindKey: { win: hist_up_key, mac: 'Alt-Up' },
    exec: function (editor) {
        console.log('hist_up')
        hist_up(editor);
    },
});

editor.commands.addCommand({
    name: 'hist_down',
    bindKey: { win: hist_down_key, mac: 'Alt-Down' },
    exec: function (editor) {
        console.log('hist_down')
        hist_down(editor);
    },
});

editor.commands.addCommand({
    name: 'sendCTRLC',
    bindKey: { win: 'Shift-Ctrl-C', mac: 'Ctrl-C' },
    exec: function (editor) {
        console.log('sendCTRLC')
        sendCTRLC(editor);
    },
});

editor.commands.addCommand({
    name: 'sendCTRLD',
    bindKey: { win: 'Shift-Ctrl-D', mac: 'Ctrl-D' },
    exec: function (editor) {
        console.log('sendCTRLD')
        sendCTRLD(editor);
    },
});

editor.commands.addCommand({
    name: 'NoRefresh',
    bindKey: { win: 'Ctrl-R', mac: 'Cmd-R' },
    exec: function (editor) {
        console.log('NoRefresh')
    },
});


function run_current_and_del() {
    run_current_raw(true);
}

function run_current() {
    run_current_raw(false);
}

function run_current_raw(del) {
    var currline = editor.getSelectionRange().start.row;
    var selected = editor.getSelectedText();
    if (selected) { // if any sellection
        send_multiple_lines(selected)
        if (del) {
            editor.insert('')
        }
    } else {
        var line_text = editor.session.getLine(currline);
        send_single_line(line_text)
        if (del) {
            editor.session.replace(new ace.Range(
                currline, 0, currline + 1, -1
            ), "\n");
            editor.gotoLine(currline + 1,
                editor.session.getLine(currline).length,
                true);
        } else {
            if (currline == editor.session.getLength() - 1) {
                editor.gotoLine(currline + 1,
                    editor.session.getLine(currline).length,
                    true);
                editor.insert('\n')
            } else {
                editor.gotoLine(currline + 2,
                    editor.session.getLine(currline + 1).length,
                    true);
            }
        }
        command.setValue('')
    }
}

function run_cell() {
    var current_line = editor.getSelectionRange().start.row;
    var topline = current_line; // included
    while (true) {
        if (topline == 0) {
            break;
        }
        if (editor.session.getLine(topline).startsWith('#%%')) {
            break;
        }
        topline -= 1;
    }
    var bottonline = current_line; // not included
    while (true) {
        bottonline += 1
        if (bottonline == editor.session.getLength()) {
            editor.gotoLine(editor.session.getLength(), 0, true);
            break;
        }
        if (editor.session.getLine(bottonline).startsWith('#%%')) {
            editor.gotoLine(bottonline + 1, 0, true);
            break;
        }
    }
    var cell = editor.getValue().split('\n').slice(topline, bottonline).join('\n');

    console.log(cell);

    send_multiple_lines(cell);
}

function append_command_to_editor() {
    editor.insert(command.getValue())
    command.setValue("")
}

console.log('editor.js loaded')