/**
 * file relared
 */

async function save_and_run() {
    // over ride
    var serial_out_len = serial_value_text.length;
    await writeFile(fileHandle, editor.getValue());
    console.log('file saved');
    setTimeout(function () {
        // wait for 1s, if nothing changed in the serial out, 
        // then send command to force run the saved script
        if (serial_out_len == serial_value_text.length) {
            console.log('save did not trigger run, manually run instead');
            sendCTRLC();
            setTimeout(function () {
                sendCTRLD();
            }, 50);
        }
    }, 1500);
}

/**
 * Serial driver *******************************************************
 */

let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

async function connect() {
    // connect to serial

    // - Request a port and open a connection.
    port = await navigator.serial.requestPort();

    // - Wait for the port to open.
    await port.open({ baudRate: 115200 });

    // if connected, change the button name
    document.getElementById("connect").innerHTML = connected_info;

    // setup the output stream.
    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    // read the stream.
    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    reader = inputStream.getReader();
    readLoop();
}

async function disconnect() {
    // not used actually

    // Close the input stream (reader).
    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => { });
        reader = null;
        inputDone = null;
    }

    // Close the output stream.
    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }

    // Close the port.
    await port.close();
    port = null;
}

async function clickConnect() {
    // if connected, ignore the button action
    if (port) {
        return;
    }

    // CODELAB: Add connect code here.
    await connect();
}

var serial_value_text = "";
async function readLoop() {
    // Reads data from the input stream and displays it in the console.
    while (true) {
        const { value, done } = await reader.read();
        if (value) {
            serial_value_text += value;
            // removed the carriage return, for some reason CircuitPython does not need it
            //log.innerHTML += value + '\n';
        }
        if (done) {
            console.log('[readLoop] DONE', done);
            reader.releaseLock();
            break;
        }
    }
}

// auto scroll 
new ResizeObserver(function () {
    out_frame.parentNode.scrollTop = out_frame.parentNode.scrollHeight;
}).observe(out_frame)

/**
 * command related functions ****************************************************
 */

function send_cmd(s) {
    // send single byte command
    // s: str
    const writer = outputStream.getWriter();
    writer.write(s);
    writer.releaseLock();
}

function sendCTRLD() {
    send_cmd("\x04");
}

function sendCTRLC() {
    send_cmd("\x03");
}

var cmd_hist = ['print("Hello CircuitPython!")']; // command history
var cmd_ind = -1; // command history index

function push_to_cmd_hist(str) {
    if (str.trim().length != 0) {
        cmd_hist.push(str.trim());
    }
}

function send_multiple_lines(lines) {
    // send multiple lines of code to device
    // lines: str (str can contain line breaks)

    // push to history
    push_to_cmd_hist(lines);
    cmd_ind = -1;

    // dealing with linebreaks and '\n' in text
    lines = lines.split('\\').join('\\\\').split('\n').join('\\n')

    // remove comments by """
    lines = lines.split('"""')
    for (var i = 0; i < lines.length; i++) {
        lines.splice(i + 1, 1);
    }
    lines = lines.join("")

    // send commands to device
    if (outputStream != null) {
        const writer = outputStream.getWriter();
        // https://stackoverflow.com/a/60111488/7037749
        writer.write('exec("""' + lines + '""")' + '\x0D')
        writer.releaseLock();
    }
    else {
        console.log("Can not write, no connection.");
    }
}

function send_single_line(line) {
    // send one line of code to device

    // if command not empty, push the command to history
    push_to_cmd_hist(line);
    cmd_ind = -1;

    // send the command to device
    if (outputStream != null) {
        const writer = outputStream.getWriter();
        writer.write(line.trim() + '\x0D');
        writer.releaseLock();
    }
    else {
        console.log("Can not write, no connection.");
    }
}

function savelog() {
    // only works out side html
    download(
        serial_value_text,
        'log.txt',
        'text'
    )
}

/**
 * Ace related
 */

ace.require("ace/ext/language_tools");

// serial console prints
var serial = ace.edit("serial");
serial.setOptions({
    // https://stackoverflow.com/a/13579233/7037749
    maxLines: Infinity
});
serial.setTheme("ace/theme/monokai");
serial.setReadOnly(true);
serial.session.setUseWrapMode(true);
serial.renderer.setShowGutter(false);

// serial console commands
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

// command newline and send
var enter_to_send = true;
function set_send_key() {
    if (enter_to_send) {
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
    } else {
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
}
set_send_key();

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

// editor

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

/**
 * Serial Prints related
 */

var serial_disp_text = serial_value_text.slice(end = -10000);
function serial_disp_loop() {
    var rand = Math.round(Math.random() * 10) + 90;
    receiving_timer = setTimeout(function () {
        var serial_disp_text_now = serial_value_text.slice(end = -10000);
        if (serial_disp_text_now != serial_disp_text) {
            serial_disp_text = serial_disp_text_now;
            // https://stackoverflow.com/a/18629202/7037749
            serial.setValue(serial_disp_text, 1);
            // if plot on, refresh plot
            if (document.getElementById("plot").style.display == "") {
                plot_refresh();
            }
        }
        serial_disp_loop();
    }, rand);
}
serial_disp_loop();


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

function run_command() {
    var line = command.getValue().trim();
    if (command.session.getLength() == 1) {
        send_single_line(line);
    } else {
        send_multiple_lines(line);
    }
    command.setValue("")
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
        command.setValue(cmd_hist[cmd_ind], 1)
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
            command.setValue(temp_cmd, -1);
            cmd_ind = -1;
        } else {
            cmd_ind += 1
            command.setValue(cmd_hist[cmd_ind], -1)
        }
    } else {
        command.gotoLine(
            command.getSelectionRange().start.row + 2,
            command.getSelectionRange().start.column,
            true,
        )
    }
}

/**
 * tab control ************************
 */

// a handle of the new window that othe functions can operate
var tablist = []

// auto close child window on mother window close
window.addEventListener("beforeunload", function (e) {
    // Do something
    for (var i = 0; i < tablist.length; i++) {
        tablist[i].close()
    }
}, false);

// create new window and set style
function new_tab() {
    tablist.push(window.open('tab.html'))
}

/**
 * Plot
 */

function text_to_data(text) {
    lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim().split(' ');
    }
    return lines;
}

function plot_lines_find_end(lines) {
    var start = 1; // first line is title
    var end = lines.length - 1;
    while (start + 1 < end) {
        var mid = parseInt((start + end) / 2)
        if (isNaN(parseFloat(lines[mid][0]))) {
            end = mid;
        } else {
            start = mid;
        }
    }
    return start;
}

function transpose(array) {
    return array[0].map((_, colIndex) => array.map(row => parseFloat(row[colIndex])));
}

function plot_refresh() {
    var data = [];
    var xlabel = 'index';
    try {
        var plot_raw_list = serial_value_text.split('startplot:').slice(1,);
        var plot_raw_text = plot_raw_list.at(-1);
        var plot_raw_lines = text_to_data(plot_raw_text);
        var plot_labels = plot_raw_lines[0];
        var plot_data_lines = plot_raw_lines.slice(1, plot_lines_find_end(plot_raw_lines) + 1);
        var plot_data = transpose(plot_data_lines);

        if (document.getElementById("x-axis").checked & plot_labels.length > 1) {
            xlabel = plot_labels[0];
            for (var i = 1; i < plot_labels.length; i++) {
                var curve = {};
                curve['x'] = plot_data[0];
                curve['y'] = plot_data[i];
                curve['name'] = plot_labels[i];
                curve['type'] = 'scatter';
                data.push(curve);
            }
        } else {
            for (var i = 0; i < plot_labels.length; i++) {
                var curve = {};
                curve['x'] = i;
                curve['y'] = plot_data[i];
                curve['name'] = plot_labels[i];
                curve['type'] = 'scatter';
                data.push(curve);
            }
        }
    } catch { }
    var layout = {
        showlegend: true,
        xaxis: {
            title: xlabel,
        }
    };
    Plotly.newPlot('plot', data, layout);
}

function plot_main() {
    if (document.getElementById("plot").style.display == "") {
        document.getElementById("plot").style.display = "none"
        return
    }
    if (document.getElementById("plot").style.display == "none") {
        document.getElementById("plot").style.display = ""
        plot_refresh();
        return
    }
}
