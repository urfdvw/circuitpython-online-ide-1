
document.title = 'CPy IDE new tab'
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
        document.title = fileHandle.name
        if(fileHandle.name.endsWith('.py') | fileHandle.name.endsWith('.PY')){
            is_python.checked = true;
        } else {
            is_python.checked = false;
        }
        toggle_highlight(is_python)
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

/**
 * Code mirrow Related ***************************************************************************
 */

var editor_info = '"""\n' +
    'Open and edit an existing file in this tab.\n\n' +
    '--- Editor Keyboard Shortcuts ---\n\n' +
    '[Ctrl-S]: Save the file\n' +
    '[Ctrl-Space]: auto completion\n' +
    '"""\n\n'

CodeMirror.commands.autocomplete = function (cm) {
    cm.showHint({ hint: CodeMirror.hint.any });
    cm.showHint({ hint: CodeMirror.hint.anyword });
}

var editor = CodeMirror(document.querySelector('#my-div'), {
    lineNumbers: true,
    value: editor_info,
    tabSize: 4,
    indentUnit: 4,
    mode: 'python',
    theme: 'monokai',
    extraKeys: {
        Tab: betterTab,
        "Ctrl-Space": "autocomplete"
    },
    lineWrapping: true,
});
editor.setSize(width = '100%', height = '100%')

// https://stackoverflow.com/a/25104834/7037749
editor.addKeyMap({
    "Ctrl-S": save_and_run,
    "Ctrl-/": 'toggleComment',
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

function toggle_highlight(elem) {
    if(elem.checked){
        editor.setOption("mode", 'python')
    } else {
        editor.setOption("mode", 'text')
    }
}