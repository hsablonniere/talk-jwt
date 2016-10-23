document.body.addEventListener('keyup', function (ev) {

    xtab.emit('code-update', {
        id: ev.target.dataset.codeId,
        value: ev.target.value,
    });
});