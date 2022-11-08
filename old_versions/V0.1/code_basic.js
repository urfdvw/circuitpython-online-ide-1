/**
 * Ace Related ***************************************************************************
 * https://ace.c9.io/demo/keyboard_shortcuts.html
 */


ace.require("ace/ext/language_tools");
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/python");
editor.session.setTabSize(4);
editor.session.setUseSoftTabs(true);
editor.session.setUseWrapMode(true);

// auto completion
// https://stackoverflow.com/a/19730470/7037749
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
});

function toggle_highlight(elem) {
    if(elem.checked){
        editor.session.setMode("ace/mode/python");
    } else {
        editor.session.setMode("ace/mode/text");
    }
}

editor.commands.addCommand({
    name: 'myCommand',
    bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
    exec: function(editor) {
        save_and_run(editor);
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

editor.getSession().on('change', function() {
    file_diff = true;
    try {
        set_tab_name();
    } catch {
        console.log('set_tab_name failed');
    }
});

/**
 * File related functions *********************************************************
 */

let fileHandle;
var butOpenFile = document.getElementById("inputfile")
butOpenFile.addEventListener('click', async () => {
    [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const contents = await file.text();
    editor.session.setValue(contents);
    file_diff = false;
    set_tab_name();
    if (fileHandle.name.endsWith('.py') | fileHandle.name.endsWith('.PY')) {
        editor.session.setMode("ace/mode/python");
    } else {
        editor.session.setMode("ace/mode/text");
    }
});

function set_tab_name() {
    var name = '';
    if (file_diff) { 
        name += '* ';
    }
    name += fileHandle.name;
    document.getElementById('filename').innerHTML = name;
    document.title = name
}

async function writeFile(fileHandle, contents) {
    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(contents);
    // Close the file and write the contents to disk.
    await writable.close();
}

async function save_and_run(editor) {
    await writeFile(fileHandle, editor.getValue());
    file_diff = false;
    set_tab_name();
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

function save_code() {
    try {
        download(editor.getValue(), fileHandle.name, 'text')
    } catch {
        download(editor.getValue(), 'code.py', 'text')
    }
}

var file_diff = false;

window.addEventListener("beforeunload", function (e) {
    // https://stackoverflow.com/a/7317311/7037749
    var confirmationMessage = 'It looks like you have been editing something. '
                            + 'If you leave before saving, your changes will be lost.';

    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
});