/*
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

// not used
async function disconnect() {
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

// not used
async function clickConnect() {
    // if connected, ignore the button action
    if (port) {
        await disconnect();
        // if connected, change the button name
        document.getElementById("connect").innerHTML = "Connect Serial";
    } else {
        await connect();
        // if connected, change the button name
        document.getElementById("connect").innerHTML = "Disconnect Serial";
    }
}

var serial_text_buffer = "";
async function readLoop() {
    // Reads data from the input stream and displays it in the console.
    while (true) {
        const { value, done } = await reader.read();
        if (value) {
            if (value.search('\x1B') != -1 || serial_text_buffer.search('\x1B') != -1) {
                serial_text_buffer += value;
                if (serial_text_buffer.split('\x1B]').length == serial_text_buffer.split('\x1B\\').length) {
                    const start_ind = serial_text_buffer.lastIndexOf('\x1B]')
                    const end_ind = serial_text_buffer.lastIndexOf('\x1B\\')
                    if (start_ind > end_ind) {
                        // un reasonable satuation, print and continue
                        serial.session.insert({row: 1000000, col: 1000000}, serial_text_buffer);
                        serial_text_buffer = '';
                    } else {
                        const by_starts = serial_text_buffer.split('\x1B]0;');
                        const info = by_starts[by_starts.length-1].split('\x1B\\')[0];
                        console.log(info);
                        serial.session.insert({row: 1000000, col: 1000000}, serial_text_buffer.replace(
                            /\x1B]0;.*\x1B\\/, ''
                        ).replace(
                            /\x1B]0;.*\x1B\\/, ''
                        ).replace(
                            /\x1B]0;.*\x1B\\/, ''
                        )); // replace all has some trouble here
                        serial_text_buffer = '';
                    }
                }
            } else {
                if (value.endsWith('\r')) {
                serial_text_buffer += value;
                    // console.log('broken line ending');
                } else {
                    serial.session.insert({row: 1000000, col: 1000000}, serial_text_buffer + value);
                    serial_text_buffer = '';
                }
            }
        }
        if (done) {
            console.log('[readLoop] DONE', done);
            reader.releaseLock();
            break;
        }
    }
}
/*
* Serial Send
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