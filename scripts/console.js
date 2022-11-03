/*
* Ace
*/

ace.require("ace/ext/language_tools");

// serial console prints
var serial = ace.edit("serial");
// serial.setOptions({
//     // https://stackoverflow.com/a/13579233/7037749
//     maxLines: 10
// });
serial.setTheme("ace/theme/monokai");
serial.setReadOnly(true); //for debug
serial.session.setUseWrapMode(true);
serial.renderer.setShowGutter(false);
serial.setHighlightActiveLine(false)

// resize serial console to fit screen
function serial_fit_raw() {
    var height = document.getElementById('fixed_frame').clientHeight;
    height -= document.getElementById('title_bar').offsetHeight;
    height -= document.getElementById('serial_T').offsetHeight;
    height -= 4;
    if (height <= 100) {
        height = 100;
    }
    serial.container.style.height = height + 'px'; 
    serial.resize();
    serial.renderer.scrollToLine(Number.POSITIVE_INFINITY)
    if (plotwin.isVisible()) {
        // only refresh plot when plot is visible
        plot_refresh();
    }
}

function serial_fit(){
    setTimeout(serial_fit_raw, 100);
}

serial_fit();

serial.session.on('change', serial_fit)

console.log('serial.js loaded')