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

console.log('serial.js loaded')