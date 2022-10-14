async function check_conditions () {
    if (inputStream == undefined) {
        alert('Please connect the microcontroller via serial before continue');
        return
    }
    if (directoryHandle == undefined) {
        alert('Please open CIRCUITPY dirctory before continue');
        return
    }
    document.getElementById('workflow').style = 'display: none'
}