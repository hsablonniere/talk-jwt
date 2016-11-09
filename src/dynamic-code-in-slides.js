const channel = new BroadcastChannel('code-update')

channel.addEventListener('message', function ({ data: { body, secret } }) {

    var object = JSON.parse(body);
    var payload = JSON.stringify(object, null, '    ')
      .replace(/\[([\s\S]+)\]/mg, (match) => {
          return match
            .replace(/    /g, '')
            .replace(/[\n]/g, ' ')
            .replace(/\[ /g, '[')
            .replace(/ \]/g, ']');
      });

    document.querySelector('[data-code-id="jwt-body"]').innerText = payload;
    document.querySelector('[data-code-id="jwt-secret"]').innerText = secret;

    var jwtHeader = '{"alg": "HS256","typ": "JWT"}';

    var jwt = window.sign('HS256', jwtHeader, payload, secret);
    var signature = jwt.result.split('.')[2];

    document.querySelector('[data-code-id="jwt-signature"]').innerText = signature;

});
