class Matcher {
    constructor (target) {
        this.target = target;
        this.segment = "";
    }
    push (segment) {
        let result = [];
        segment = this.segment + segment;
        // see if the tail contains partial target
        for (let i = segment.length - this.target.length; i < segment.length; i++) {
            if (i < 0) {
                continue;
            }
            let tail = segment.slice(i);
            if (tail == this.target.slice(0, tail.length)) {
                this.segment = tail;
                segment = segment.slice(0, segment.length - tail.length);
                break;
            } else {
                this.segment = "";
            }
        }
        let parts = segment.split(this.target);
        // first output
        let first_part = parts.shift();
        if (first_part.length > 0) {
            result.push([first_part, false]);
        }
        // the rest
        for (const p of parts) {
            result.push([this.target, true]);
            result.push([p, false]);
        }
        return result;
    }
}

class Brancher {
    constructor (begin_str, end_str) {
        this.begin_matcher = new Matcher(begin_str);
        this.end_matcher = new Matcher(end_str);
        this.mood = false;
        this.matcher = this.begin_matcher;
    }
    push (segment) {
        let result = [];
        let parts = this.matcher.push(segment);
        while (parts.length > 0) {
            const p = parts.shift();
            if (!p[1]) {
                result.push([p[0], this.mood])
            } else {
                this.mood = !this.mood;
                if (this.mood) {
                    this.matcher = this.end_matcher;
                } else {
                    this.matcher = this.begin_matcher;
                }
                var rest = [];
                for (const p of parts) {
                    rest.push(p[0]);
                }
                parts = this.matcher.push(rest.join(''));
            }
        }
        return result
    }
}
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

var line_ending_matcher = new Matcher('\r\n');
var title_brancher = new Brancher('\x1B]0;', '\x1B\\');
var last_title_branch = false;
async function readLoop() {
    // Reads data from the input stream and displays it in the console.
    while (true) {
        const { value, done } = await reader.read();

        for (branch of title_brancher.push(value)) {
            title_branch = branch[1];
            if (title_branch) { // if updating title bar
                if (last_title_branch) {
                    document.getElementById('title_bar').innerHTML += branch[0];
                } else { // if just into this mood
                    document.getElementById('title_bar').innerHTML = branch[0];
                }
            } else {
                for (part of line_ending_matcher.push(branch[0])) {
                    serial.session.insert({row: 1000000, col: 1000000}, part[0]);
                }
            }
            last_title_branch = title_branch;
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