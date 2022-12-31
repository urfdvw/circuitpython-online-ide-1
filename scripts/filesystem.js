/*
* system
*/
async function read_file_content(handle) {
    const file = await handle.getFile();
    const contents = await file.text();
    // console.log(contents);
    return contents;
}

async function write_file(fileHandle, contents) {
    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(contents);
    // Close the file and write the contents to disk.
    await writable.close();
}

function download(data, filename) {
    // Function to download data to a file
    console.log(data)
    var file = new Blob([data], { type: 'text' });
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

/*
* main
*/

var directoryHandle; // move this in to the next function if necessary
// main testing code
async function open_folder(){
    directoryHandle = await window.showDirectoryPicker();
    await read_setting_panel(directoryHandle);
    await write_idesetting(directoryHandle); // this is just to trigger permission popup, necessary for creating new files
    var code_file = await code_py(directoryHandle);
    await construct_tree(directoryHandle);
}

/*
* look for code.py
*/

async function code_py(directoryHandle){
    try {
        var code_file = await directoryHandle.getFileHandle('code.py');
        console.log('code.py found')
    } catch {
        var code_file = await directoryHandle.getFileHandle('code.py', { create: true });
        await write_file(code_file, 'import board');
        console.log('code.py created')
    }
    return code_file;
}

/*
* New file
*/
function all_changes_saved() {
    for (var i = 0; i < file_details.length; i++) {
        if (file_details[i].unsavedchange) {
            alert('Please save all files before proceed.')
            return false
        }
    }
    return true
}

async function new_file(dir_handle) {
    if (!all_changes_saved()){
        return
    }
    const name = prompt("Please enter a file name including the extension");
    if (name === null || name === '') {
        return
    }
    try {
        await dir_handle.getFileHandle(name);
        alert(name + " already exists")
        return
    } catch {
        console.log(name + ' does not exist, creating')
        await dir_handle.getFileHandle(name, { create: true });
    }
    await construct_tree(directoryHandle);
}

async function new_file_root() {
    await new_file(directoryHandle);
}

async function new_file_lib() {
    try {
        await directoryHandle.getDirectoryHandle('lib');
    } catch {
        await directoryHandle.getDirectoryHandle('lib', {create: true});
    }
    const dir = await directoryHandle.getDirectoryHandle('lib');
    await new_file(dir);
}

/*
* Save file
*/

async function save_only() {
    console.log('save_only called')
    if (current_ind === undefined) {
        console.log('no current file')
        return
    }
    await write_file(file_details[current_ind].handle, editor.getValue());
    set_unsavedchange(current_ind, false);
    console.log('file saved');
}

async function save_and_run() {
    console.log('save_and_run called')
    if (current_ind === undefined) {
        console.log('no current file')
        return
    }
    var serial_out_len = serial.getValue().length;
    await write_file(file_details[current_ind].handle, editor.getValue());
    console.log('file saved');
    setTimeout(function () {
        // wait for 1s, if nothing changed in the serial out,
        // then send command to force run the saved script
        if (serial_out_len == serial.getValue().length) {
            console.log('save did not trigger run, manually run instead');
            sendCTRLC();
            setTimeout(function () {
                sendCTRLD();
            }, 50);
        }
    }, 1500);
    set_unsavedchange(current_ind, false);
}

function save_code_as() {
    console.log('save_code_as called')

    if (current_ind === undefined) {
        download(editor.getValue(), 'scratch.py', 'text')
    } else {
        download(editor.getValue(), file_details[current_ind].handle.name, 'text')
    }
}

function save_log() {
    console.log('save_log called')
    download(
        serial.getValue(),
        'log.txt'
    )
}

/*
* Folder tree
*/

var view;
function show_file_view() {
    view.changeOption("leaf_icon", '📄');
    view.changeOption("parent_icon", '📁');
    // TreeConfig.open_icon = '<i class="fas fa-angle-down"></i>';
    // TreeConfig.close_icon = '<i class="fas fa-angle-right"></i>';
    view.changeOption('show_root', false);
    view.collapseAllNodes();
    view.reload();
}

async function construct_tree(directoryHandle){
    init_folder_tree();
    var file_ind = 0;
    var first_node = true;
    // BFS
    var q = [directoryHandle];  // queue of pending handles
    var treeq = [new TreeNode(directoryHandle.name)];  // queue of tree nodes that are awaiting children
    while (q.length != 0) {
        const dir = q.shift();
        const dir_node = treeq.shift();
        // console.log(dir.name);

        if (first_node) {
            // first/root node for view
            first_node = false;
            view = new TreeView(dir_node, "#foldercontainer");
        }

        var layer = [];
        for await (const entry of dir.values()) {
            layer.push(entry)
        }

        layer.sort(function(a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        for (const entry of layer) {
            if (entry.name.startsWith('.')) {
                // skip hidden files
                continue
            }
            if (entry.name == 'System Volume Information') {
                // skip System Volume Information folder
                continue
            }
            var file_node = new TreeNode(entry.name);
            dir_node.addChild(file_node);
            // console.log(dir.name, '>', entry.name);
            if(entry.kind == 'directory') {
                q.push(entry)
                file_node.changeOption('forceParent', true)
                treeq.push(file_node)
            } else {
                if (entry.name.endsWith('.mpy')) {
                    // disable compiled files
                    file_node.setEnabled(false);
                } else {
                    const cur_ind = file_ind + 0;
                    file_ind += 1;
                    const session = await init_session(entry, cur_ind);
                    file_details.push({
                        handle: entry,
                        session: session,
                        unsavedchange: false
                    });
                    create_tab(cur_ind);
                    file_node.on("click", function() {on_click_file(cur_ind)});
                }
            }
        }
    }
    show_file_view();
}

async function reload_folder_view() {
    if (!all_changes_saved()){
        return
    }
    await construct_tree(directoryHandle);
}

/*
* file detail related function
*/

async function init_session(handle, ind) {
    var content = await read_file_content(handle);
    var session = ace.createEditSession(content);
    // https://github.com/ajaxorg/ace/issues/2045#issuecomment-48851333
    if (handle.name.endsWith('.py') || handle.name.endsWith('.PY')) {
        session.setMode("ace/mode/python");
    }
    session.setTabSize(4);
    session.setUseSoftTabs(true);
    session.setUseWrapMode(true);
    session.on('change', function() {
        set_unsavedchange(current_ind, true);
    });
    return session
}

function init_folder_tree() {
    editor.setSession(scratch_session);
    for (var i = 0; i < file_details.length; i++) {
        const el = document.getElementById('tab' + i);
        el.parentElement.removeChild(el);
    }
    current_ind = undefined;
    file_details = [];
}

var current_ind = undefined;
var file_details = [];

function create_tab(ind) {
    var element = document.createElement('div');
    element.id = 'tab' + ind;
    element.style = "display:none";
    element.classList.add('tab')
    element.innerHTML=`<text id="tabindicator` + ind + `" style="display:none">•</text>
    <a id="tabtitle` + ind + `" href="#" onclick="on_click_tab(` + ind + `)">` + file_details[ind].handle.name + `</a>
    <a href="#" onclick="on_close_tab(` + ind + `)">×</a>`
    document.getElementById('tabs').appendChild(element);
}

function on_click_file(ind) {
    document.getElementById("tab" + ind).style =  "display: ''";
    on_click_tab(ind)
}

function on_click_tab(ind) {
    editor.setSession(file_details[ind].session);
    if (current_ind != undefined){
        set_highlight(current_ind, false);
    }
    set_highlight(ind, true);
    current_ind = ind;
}

function on_close_tab(ind) {
    if (file_details[ind].unsavedchange) {
        alert('Please save file before close.');
        return;
    }
    // hide tab
    document.getElementById("tab" + ind).style =  "display: none";
    if (ind == current_ind) {
        set_highlight(current_ind, false);
        var no_tab_left = true;
        for (var i = 0; i < file_details.length; i++) {
            const el = document.getElementById('tab' + i);
            if (el.style.display === '') {
                no_tab_left = false;
                on_click_tab(i);
                return;
            }
        }
        if (no_tab_left) {
            // change to scratch session
            current_ind = undefined;
            editor.setSession(scratch_session);
        }
    }
}

function set_unsavedchange(ind, value) {
    file_details[current_ind].unsavedchange = value;
    if (value) {
        document.getElementById("tabindicator" + ind).style =  "display: ''";
    } else {
        document.getElementById("tabindicator" + ind).style =  "display: none";
    }
}

function set_highlight(ind, value) {
    if (value) {
        document.getElementById("tabtitle" + ind).classList.add('neotext');
    } else {
        document.getElementById("tabtitle" + ind).classList.remove('neotext');
    }
}

/*
* Settings
*/

const setting_file_name = '.idesettings';

async function read_setting_file(directoryHandle) {
    try {
        var setting_file = await directoryHandle.getFileHandle(setting_file_name);
        console.log(setting_file_name + ' found');
    } catch {
        var setting_file = await directoryHandle.getFileHandle(setting_file_name, { create: true });
        var init_setting = await read_init_setting(directoryHandle);
        await write_file(setting_file, JSON.stringify(init_setting));
        console.log(setting_file_name + ' created')
    }
    return setting_file;
}

async function read_init_setting(directoryHandle) {
    const bootOutHandle = await directoryHandle.getFileHandle('boot_out.txt');
    const file = await bootOutHandle.getFile();
    const contents = await file.text();
    const title = contents.split('\n')[0].split('with ')[1];
    var idesetting = JSON.parse(JSON.stringify(settingdefault));
    idesetting.name = title;
    return idesetting
}

async function read_idesetting(directoryHandle) {
    const setting_file = await read_setting_file(directoryHandle);
    const setting_text = await read_file_content(setting_file);
    var idesetting = JSON.parse(setting_text);
    return idesetting;
}

async function read_setting_panel(directoryHandle) {
    const idesetting = await read_idesetting(directoryHandle);
    document.getElementById('name_setting').value = idesetting.name;
    document.title = idesetting.name
    document.querySelector('#layout_setting').value = idesetting.layout;
    if (idesetting.layout == 0) {
        document.getElementById('layout_style').href = "style/layoutsidebyside.css"
    } else if (idesetting.layout == 1) {
        document.getElementById('layout_style').href = "style/layouttopbutton.css"
    }
    document.querySelector('#command_enter_setting').value = idesetting.command_enter;
    if (idesetting.command_enter == 0) {
        enter_to_send();
    } else if (idesetting.command_enter == 1) {
        senter_to_send();
    }
    document.getElementById('font_setting').value = idesetting.font;
    editor.setOptions({fontSize: idesetting.font + 'pt'});
    serial.setOptions({fontSize: idesetting.font + 'pt'});
    command.setOptions({fontSize: idesetting.font + 'pt'});
    serial_fit();
}

async function write_setting_panel() {
    var idesetting = JSON.parse(JSON.stringify(settingdefault));
    idesetting.name = document.getElementById('name_setting').value;
    idesetting.layout = document.querySelector('#layout_setting').value;
    idesetting.command_enter = document.querySelector('#command_enter_setting').value;
    idesetting.font = document.getElementById('font_setting').value;
    return idesetting;
}

async function write_idesetting(directoryHandle) {
    const idesetting = await write_setting_panel();
    const setting_file = await read_setting_file(directoryHandle);
    await write_file(setting_file, JSON.stringify(idesetting));
    await read_setting_panel(directoryHandle);
}

console.log('filesystem.js loaded')
