class State {
    constructor (val=0) {
        this._val = val;
        this._last = val;
    }

    set now(val) {
        this._last = this._val;
        this._val = val;
    }

    get now () {
        return this._val;
    }

    get diff () {
        return this._val - this._last;
    }
}

class TargetMatcher {
    constructor (target) {
        if (target === undefined){
            this.clear_target();
        } else {
            this.target = target;
        }
        this.segment = "";
        this.mood = new State()
    }
    push (segment) {
        let result = [];
        segment = this.segment + segment;
        this.segment = '';
        // see if the tail contains partial target
        for (let i = segment.length - this.target.length; i < segment.length; i++) {
            if (i < 0) {
                continue;
            }
            let tail = segment.slice(i);
            if (tail === this.target) {
                break
            }
            if (tail === this.target.slice(0, tail.length)) {
                this.segment = tail;
                segment = segment.slice(0, segment.length - tail.length);
                break;
            } else {
                this.segment = "";
            }
        }
        let parts = segment.split(this.target);

        for (let i = 0; i < parts.length; i++) {
            if (i != 0) {
                this.mood.now = 1;
                result.push([this.target, this.mood.now, this.mood.diff]);
            }
            if (parts[i].length > 0) {
                this.mood.now = 0;
                result.push([parts[i], this.mood.now, this.mood.diff]);
            }
        }
        return result;
    }
    clear_target () {
        this.target = 'You shall not pass! (∩๏‿‿๏)⊃━☆ﾟ.*';
    }
}

class BracketMatcher {
    constructor (begin_str, end_str) {
        this.begin_matcher = new TargetMatcher(begin_str);
        this.end_matcher = new TargetMatcher(end_str);
        this.mood = new State();
        this.matcher = this.begin_matcher;
    }
    push (segment) {
        let outlet = [];
        let parts = this.matcher.push(segment);
        while (parts.length > 0) {
            // get current part
            const current = parts.shift();
            // skip if empty
            if (current[0].length === 0) {
                continue;
            }
            if (current[1] === 0) {
                // if not matching, append to outlet
                outlet.push([current[0], this.mood.now, this.mood.diff])
                this.mood.now = this.mood.now; // update mood because it is used
            } else {
                this.mood.now = 1 - this.mood.now;
                if (this.mood.now === 1) {
                    this.matcher = this.end_matcher;
                } else {
                    this.matcher = this.begin_matcher;
                }
                var rest = [];
                for (const p of parts) {
                    rest.push(p[0]);
                }
                const text = rest.join('');
                parts = this.matcher.push(text);
            }
        }
        return outlet
    }
}

class MatcherProcessor {
    constructor (
        matcher,
        in_action = () => {},
        enter_action = () => {},
        exit_action = () => {},
        out_action = () => {},
    ) {
        this.matcher = matcher;
        this.in_action = in_action;
        this.enter_action = enter_action;
        this.exit_action = exit_action;
        this.out_action = out_action;

        this.through = false;
        this.segment = '';

        this.branch = [];
    }
    push (parts) {
        var outlet = [];
        this.branch = [];
        for (const part_in of parts) {
            for (const part_out of this.matcher.push(part_in)) {
                const text = part_out[0];
                const mood = part_out[1];
                const diff = part_out[2];
                if (diff === 1) {
                    this.enter_action(text);
                }
                if (mood === 1) {
                    this.in_action(text);
                    if (this.through) {
                        outlet.push(text);
                    } else {
                        this.branch.push(text);
                    }
                }
                if (diff === -1) {
                    this.exit_action(text);
                }
                if (mood === 0) {
                    this.out_action(text);
                    outlet.push(text);
                }
            }
        }
        return outlet;
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

let line_ending_matcher = new TargetMatcher('\r\n');
let line_ending_processor = new MatcherProcessor(
    line_ending_matcher
)
line_ending_processor.through = true;

let title_processor = new MatcherProcessor(
    new BracketMatcher(
        '\x1B]0;',
        '\x1B\\',
    ),
    (text) => {document.getElementById('title_bar').innerHTML += text},
    () => {document.getElementById('title_bar').innerHTML = ""}
);

let exec_processor = new MatcherProcessor(
    new BracketMatcher(
        'exec("""',
        '""")',
    ),
    (text) => {
        serial.session.insert(
            {row: 1000000, col: 1000000},
            text.split('\\n').join('\n')
        )
    },
    () => {serial.session.insert({row: 1000000, col: 1000000}, '\n')}
);

let echo_matcher = new TargetMatcher();
let echo_processor = new MatcherProcessor(
    echo_matcher,
    (text) => {
    () => {},
    () => {
        echo_matcher.clear_target(); // other wise will might be matched twice.
    }
);
echo_processor.through = true;

async function readLoop() {
    // Reads data from the input stream and displays it in the console.
    while (true) {
        const { value, done } = await reader.read();
        console.log('DEBUG', 'serial in', [value])
        var parts = [];
        for (const part of line_ending_matcher.push(value)) {
            parts.push(part[0]);
        }

        console.log('DEBUG', 'parts', parts);

        for (let processor of [
            title_processor,
            echo_processor,
            exec_processor,
        ]){
            parts = processor.push(parts);
            console.log('DEBUG', 'parts', parts);
        }

        for (const part of parts) {
            serial.session.insert({row: 1000000, col: 1000000}, part);
        }

        /* Weird issue with weird solution
        if the following line is removed.
        some competing issues happems
        like if start from REPL
        and run a cell
        >>> will appear in the middle of the code block
        */
        serial.session.getValue(); 
        
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
    console.log('DEBUG', 'serial out', [s]);
    let target = s.slice(0, -1);
    if (target.length > 0){
        echo_matcher.target = target;
    }
    if (outputStream != null) {
        const writer = outputStream.getWriter();
        writer.write(s);
        writer.releaseLock();
    }
    else {
        console.log("send_cmd() failed, no connection.");
    }
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
    if (serial.getValue().slice(-4, -1) !== ">>>") {
        sendCTRLC();
    }
    
    send_cmd('exec("""' + lines + '""")' + '\x0D')
    // https://stackoverflow.com/a/60111488/7037749
}

function send_single_line(line) {
    // send one line of code to device

    // if command not empty, push the command to history
    push_to_cmd_hist(line);
    cmd_ind = -1;

    // send the command to device
    send_cmd(line.trim() + '\x0D');
}