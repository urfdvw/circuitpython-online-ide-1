const setting_file_name = ".idesettings";

const settingdefault = {
    name: "",
    layout: 0,
    command_enter: 0,
    font: "12",
};

async function read_init_setting() {
    var title = "CircuitPy";
    try {
        const bootOutHandle = await directoryHandle.getFileHandle("boot_out.txt");
        const file = await bootOutHandle.getFile();
        const contents = await file.text();
        title = contents.split("\r\n")[0].split("with ")[1].trim();
    } catch {
        console.log("boot_out.txt missing");
    }
    if (title.trim().length === 0) {
        title = "CircuitPy";
    }
    var idesetting = JSON.parse(JSON.stringify(settingdefault));
    idesetting.name = title;
    return idesetting;
}

async function load_setting_from_file() {
    let setting_obj = {};
    let out = {};
    let file_broken = false;
    try {
        // check file existence
        var setting_file = await directoryHandle.getFileHandle(setting_file_name);
        console.log(setting_file_name + " found");
    } catch {
        file_broken = true;
        console.log("setting file does not exist");
    }
    if (!file_broken) {
        // if json not complete
        try {
            const setting_text = await read_file_content(setting_file);
            setting_obj = JSON.parse(setting_text);
        } catch {
            file_broken = true;
            console.log("setting file broken");
        }
    }
    if (!file_broken) {
        // if missing fields
        for (const [key, value] of Object.entries(settingdefault)) {
            if (setting_obj[key] !== undefined) {
                out[key] = setting_obj[key];
            } else {
                console.log("setting", key, "not found in setting file");
                file_broken = true;
            }
        }
    }
    if (file_broken) {
        var setting_file = await directoryHandle.getFileHandle(setting_file_name, { create: true });
        out = await read_init_setting();
        await write_file(setting_file, JSON.stringify(out));
        console.log(setting_file_name + " created");
    }
    // console.log(out)
    return out;
}

// old code --------

// 'use strict';
{
    let hide = document.getElementById("cover");
    hide.addEventListener("click", function () {
        document.body.className = "";
        write_idesetting();
    });
}

async function read_setting_panel() {
    const idesetting = await load_setting_from_file();
    document.getElementById("name_setting").value = idesetting.name;
    document.title = idesetting.name;
    document.querySelector("#layout_setting").value = idesetting.layout;
    if (idesetting.layout == 0) {
        document.getElementById("layout_style").href = "style/layoutsidebyside.css";
    } else if (idesetting.layout == 1) {
        document.getElementById("layout_style").href = "style/layouttopbutton.css";
    }
    document.querySelector("#command_enter_setting").value = idesetting.command_enter;
    if (idesetting.command_enter == 0) {
        enter_to_send();
    } else if (idesetting.command_enter == 1) {
        senter_to_send();
    }
    document.getElementById("font_setting").value = idesetting.font;
    editor.setOptions({ fontSize: idesetting.font + "pt" });
    serial.setOptions({ fontSize: idesetting.font + "pt" });
    command.setOptions({ fontSize: idesetting.font + "pt" });
    serial_fit();
}

async function write_idesetting() {
    var idesetting = JSON.parse(JSON.stringify(settingdefault));
    idesetting.name = document.getElementById("name_setting").value;
    idesetting.layout = document.querySelector("#layout_setting").value;
    idesetting.command_enter = document.querySelector("#command_enter_setting").value;
    idesetting.font = document.getElementById("font_setting").value;
    // console.log('write to file:', idesetting)
    const setting_file = await directoryHandle.getFileHandle(setting_file_name);
    await write_file(setting_file, JSON.stringify(idesetting));
    await read_setting_panel(directoryHandle);
}

console.log("setting.js loaded");
