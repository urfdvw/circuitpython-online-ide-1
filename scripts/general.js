// conformation brfore leave
window.addEventListener("beforeunload", function (e) {
    // https://stackoverflow.com/a/7317311/7037749
    var confirmationMessage = 'It looks like you have been editing something. '
                            + 'If you leave before saving, your changes will be lost.';

    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
});

// hide/show folder tree
function ToggleFolderDisplay() {
    var x = document.getElementById("folderbox");
    var y = document.getElementById("dividertext");
    if (x.style.display === "none") {
      x.style.display = "block";
      y.innerHTML = "Hide Folder";
    } else {
      x.style.display = "none";
      y.innerHTML = "Show Folder";
    }
}

// make editor size follow parent size
new ResizeObserver(function (){
  editor.resize();
  // console.log('editor resized');
}).observe(editorbox);

// make console size follow parent size
new ResizeObserver(function (){
  serial.resize();
  command.resize();
  // console.log('console resized');
}).observe(fixed_frame);

console.log('general.js loaded')