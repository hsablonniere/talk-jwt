(function () {

    var listeners = {};

    window.addEventListener('storage', function (event) {

        var data;
        var listener = listeners[event.key];

        if (listener != null) {
            data = JSON.parse(event.newValue).data;
            listener(data);
        }
    });

    window.xtab = {

        emit: function (eventName, data) {

            localStorage.setItem(eventName, JSON.stringify({
                data: data,
                sentAt: new Date().getTime(),
            }));
        },

        on: function (eventName, listenerForEvent) {
            listeners[eventName] = listenerForEvent;
        },
    };

}());
