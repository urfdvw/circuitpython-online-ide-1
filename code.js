/**
 * info ****************************************************************
 */
function show_alert() {
    alert("Browser not supported!\n\nPlease use the latest version of Chrome browser, Chrome OS, or Chromium based browsers such as MS Edge.\nPlease use the desktop version of the browsers, not the android or ios version.")
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
    await port.open({ baudRate: 9600 });

    // if connected, change the button name
    document.getElementById("connect").innerHTML = "connected"

    // setup the output stream.
    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    // read the stream.
    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    // clear current log
    document.getElementById("serial_out").innerHTML = "";

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
    try {
        await connect();
    } catch {
        show_alert();
    }
}

async function readLoop() {
    // Reads data from the input stream and displays it in the console.
    while (true) {
        const { value, done } = await reader.read();
        if (value) {
            document.getElementById('serial_out').innerHTML += value;
            // removed the carriage return, for some reason CircuitPython does not need it
            //log.innerHTML += value + '\n';
            log_parent = document.getElementById('serial_out').parentNode.parentNode
            log_parent.scrollTop = log_parent.scrollHeight;
        }
        if (done) {
            console.log('[readLoop] DONE', done);
            reader.releaseLock();
            break;
        }
    }

}

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

function send_multiple_lines(lines) {
    // send multiple lines of code to device
    // lines: str (str can contain line breaks)

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

var cmd_hist = ['print("Hello CircuitPython!")']; // command history
var cmd_ind = -1; // command history index

function send_single_line(line) {
    // send one line of code to device

    // if command not empty, push the command to history
    if (line.trim().length != 0) {
        cmd_hist.push(line);
        cmd_ind = -1;
    }

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

/**
 * File related functions *********************************************************
 */

let fileHandle;
var butOpenFile = document.getElementById("inputfile")
butOpenFile.addEventListener('click', async () => {
    try {
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        editor.setValue(contents);
        document.getElementById('filename').innerHTML = fileHandle.name;
    } catch {
        show_alert()
    }
});

async function writeFile(fileHandle, contents) {
    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(contents);
    // Close the file and write the contents to disk.
    await writable.close();
}

function save_and_run(cm) {
    writeFile(fileHandle, cm.getValue());
}

function download(data, filename, type) {
    // Function to download data to a file
    console.log(data)
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function savelog() {
    // only works out side html
    download(
        document.getElementById('serial_out').innerHTML.split('&gt;').join('>'),
        'log.txt',
        'text'
    )
}

/**
 * Code mirrow Related ***************************************************************************
 */

var info = '"""\n'
info += 'Please connect the board before any operation.\n\n'
info += '--- Editor Keyboard Shortcuts ---\n\n'
info += '[Ctrl-S]: Save the file\n    This will trigger reset and run in File mode\n'
info += '[Ctrl-Space]: auto completion\n\n'
info += 'REPL Mode Specific:\n'
info += '[Shift-Enter] to run current line of code\n    or selected multiple lines of code.\n'
info += '[Ctrl-Enter] to clear existing variable(s) and run current file.\n'
info += '    This is best after restart REPL and [Ctrl-S]\n'
info += '"""\nimport board\n'

CodeMirror.commands.autocomplete = function (cm) {
    cm.showHint({ hint: CodeMirror.hint.any });
    cm.showHint({ hint: CodeMirror.hint.anyword });
}

var editor = CodeMirror(document.querySelector('#my-div'), {
    lineNumbers: true,
    value: info,
    tabSize: 4,
    indentUnit: 4,
    mode: 'python',
    theme: 'monokai',
    extraKeys: {
        Tab: betterTab,
        "Ctrl-Space": "autocomplete"
    },
});
editor.setSize(width = '100%', height = '100%')

var command = CodeMirror(document.querySelector('#serial_in'), {
    lineNumbers: false,
    value: 'print("In REPL mode, type single-line commands here. Press [Enter] to send")',
    tabSize: 4,
    indentUnit: 4,
    mode: 'python',
    extraKeys: { Tab: betterTab },
});
command.setSize(width = '100%', height = '100%')

// https://stackoverflow.com/a/25104834/7037749
editor.addKeyMap({
    "Shift-Enter": run_current,
    "Ctrl-Enter": run_all_lines,
    "Ctrl-S": save_and_run,
    "Ctrl-/": 'toggleComment',
});

command.addKeyMap({
    "Shift-Enter": run_command,
    "Ctrl-Enter": run_command,
    "Enter": run_command,
    "Up": hist_up,
    "Down": hist_down,
    "Ctrl-C": sendCTRLC,
    "Ctrl-D": sendCTRLD,
});

function betterTab(cm) {
    // https://github.com/codemirror/CodeMirror/issues/988#issuecomment-14921785
    if (cm.somethingSelected()) {
        cm.indentSelection("add");
    } else {
        cm.replaceSelection(cm.getOption("indentWithTabs") ? "\t" :
            Array(cm.getOption("tabSize") + 1).join(" "), "end", "+input");
    }
}

function run_current(cm) {
    var selected = cm.getSelection()
    if (selected) { // if any sellection
        send_multiple_lines(selected)
    } else {
        send_single_line(cm.getLine(cm.getCursor()["line"]))
        if (cm.lineCount() == cm.getCursor()["line"] + 1) { // if last line
            var line = cm.getLine(cm.getCursor()["line"])
            var indent = line.length - line.trimLeft().length
            var doc = cm.getDoc();
            var cursor = doc.getCursor();
            for (var i = 0; i < indent - 4; i++) {
                console.log(cursor)
                doc.replaceRange(' ', cursor);
            }
            doc.replaceRange('\n', cursor); // reversed order, because cursor not moved
        } else {
            cm.setCursor({
                line: cm.getCursor()["line"] + 1,
                ch: cm.getLine(cm.getCursor()["line"] + 1).length
            })
        }
    }
}

function run_all_lines() {
    cmd = "import gc\n"
    cmd += "gc.enable()\n"
    cmd += "import sys\nsys.modules.clear()\n"
    cmd += "while globals():\n"
    cmd += "    del globals()[list(globals().keys())[0]]\n"
    cmd += "__name__ = '__main__'\n"
    cmd += "import gc\n"
    cmd += "gc.enable()\n"
    cmd += "gc.collect()\n"
    cmd += "from " + fileHandle.name.split('.')[0] + " import *"
    send_multiple_lines(cmd)
}

function run_command(cm) {
    var line = cm.getLine(cm.getCursor()["line"])
    send_single_line(line)
    cm.setValue("")
}

function hist_up(cm) {
    if (cmd_ind == -1) {
        cmd_ind = cmd_hist.length - 1
    } else {
        cmd_ind -= 1
    }
    if (cmd_ind < 0) {
        cmd_ind = 0
    }
    cm.setValue(cmd_hist[cmd_ind])
}

function hist_down(cm) {
    if (cmd_ind == -1) {
        cmd_ind = cmd_hist.length - 1
    } else {
        cmd_ind += 1
    }
    if (cmd_ind >= cmd_hist.length) {
        cmd_ind = cmd_hist.length - 1
    }
    cm.setValue(cmd_hist[cmd_ind])
}