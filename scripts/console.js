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

serial.container.style.height = '600px'
serial.resize();
serial.session.on('change', () => {
    serial.renderer.scrollToLine(Number.POSITIVE_INFINITY)
})

console.log('serial.js loaded')