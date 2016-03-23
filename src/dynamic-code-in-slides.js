xtab.on('code-update', function (data) {

    if (data.id === 'jwt-body') {

        var object = JSON.parse(data.value);
        var payload = JSON.stringify(object, null, '    ')
            .replace(/\[([\s\S]+)\]/mg, (match) => {
                return match
                    .replace(/    /g, '')
                    .replace(/[\n]/g, ' ')
                    .replace(/\[ /g, '[')
                    .replace(/ \]/g, ']');
            });

        document.querySelector('[data-code-id="jwt-body"]').innerText = payload;

        var jwtHeader = '{"alg": "HS256","typ": "JWT"}';

        var jwt = window.sign('HS256', jwtHeader, payload, 's3cr3t');
        var signature = jwt.result.split('.')[2];

        document.querySelector('[data-code-id="jwt-signature"]').innerText = signature;
    }

});