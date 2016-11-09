const channel = new BroadcastChannel('code-update')

const jwtBody = document.querySelector('[data-code-id="jwt-body"]')
const jwtSecret = document.querySelector('[data-code-id="jwt-secret"]')

document.body.addEventListener('keyup', function (ev) {

    channel.postMessage({
        body: jwtBody.value,
        secret: jwtSecret.value
    });
});
