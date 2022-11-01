/*
* Ace
*/

ace.require("ace/ext/language_tools");

// serial console prints
var serial = ace.edit("serial");
serial.setOptions({
    // https://stackoverflow.com/a/13579233/7037749
    maxLines: Infinity
});
serial.setTheme("ace/theme/monokai");
serial.setReadOnly(true); //for debug
serial.session.setUseWrapMode(true);
serial.renderer.setShowGutter(false);

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

console.log('serial.js loaded')