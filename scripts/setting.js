// 'use strict';
{
    let hide = document.getElementById('cover');
    hide.addEventListener('click', function() {
        document.body.className = '';
        write_idesetting(directoryHandle);
    })
}