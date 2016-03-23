'use strict';
/* global HTMLElement: false, document: false, window: false, URL: false */

(function () {

    var $$ = function (selector, parent) {
        parent = parent || document;
        return [].slice.call(parent.querySelectorAll(selector));
    };

    var states = [],
        statesByCursor = {},
        statesBySteps = {},
        currentState,
        currentStateIdx;

    var overviewEnabled = false,
        embedded = false,
        mediaEnabled = true,
        messageSource;

    function resizeAndCenterBody() {

        var horRatio = document.body.clientWidth / window.innerWidth,
            verticalRatio = document.body.clientHeight / window.innerHeight,
            scaleRatio = (1 / Math.max(horRatio, verticalRatio)),
            hShift = 0,
            vShift = 0;

        if (overviewEnabled) {
            scaleRatio = 1 / horRatio;
        } else {
            hShift = (window.innerWidth - (document.body.clientWidth * scaleRatio)) / 2;
            vShift = (window.innerHeight - (document.body.clientHeight * scaleRatio)) / 2;
        }

        document.body.style.transform = 'translate3d(' + hShift.toFixed(4) + 'px, ' + vShift.toFixed(4) + 'px, 0) scale(' + scaleRatio.toFixed(4) + ')';
    }

    function readCursorFromUrl(url) {

        var cursor = url.split('#')[1],
            descriptor = statesByCursor[cursor];

        if (descriptor != null) {
            displayCursor(descriptor);
        } else {
            goToFirstCursor();
        }
    }

    function loadCursorInHref(cursor) {

        var urlParts = window.location.href.split('#');
        urlParts[1] = cursor;
        window.location.replace(urlParts.join('#'));
    }

    function displayCursor(newState) {

        if (currentState == null || newState.stepElt !== currentState.stepElt) {
            setTimeout(fitTitle, 100);
        }

        currentState = newState;
        currentStateIdx = states.indexOf(newState);

        states.forEach(function (state) {
            state.stepElt.setAttribute('data-state', 'none');
        });

        currentState.previousStepElt.setAttribute('data-state', 'previous');
        currentState.stepElt.setAttribute('data-state', 'current');
        currentState.nextStepElt.setAttribute('data-state', 'next');

        displayFragment(newState);

        toggleMultimedia(document.body, true);
        //toggleMultimedia();

        setCursorOnBody();

        sendState();
    }

    function displayFragment(newState) {

        newState.fragmentElts.forEach(function (fragmentElt) {
            fragmentElt.removeAttribute('aria-selected');
            fragmentElt.parentNode.removeAttribute('active');
        });

        newState.selectedFragmentElt.setAttribute('aria-selected', 'true');

        var selectedFragmentParentIdx = newState.fragmentParentElts.indexOf(newState.selectedFragmentElt.parentNode);
        if (selectedFragmentParentIdx !== -1) {
            newState.fragmentParentElts.slice(0, selectedFragmentParentIdx + 1).forEach(function (parentElt) {
                parentElt.setAttribute('active', 'true');
            });
        }
    }

    function toggleMultimedia(target, forcePause) {

        target = target || currentState.stepElt;
        var medias = $$('video, audio', target);

        medias.forEach(function (media) {
            if (forcePause === true || !media.paused || !mediaEnabled) {
                media.pause && media.pause();
            } else {
                media.play && media.play();
            }
        });
    }

    var timeoutId, triggerBool = false;

    function triggerAction(bool) {

        document.body.classList.toggle('triggerAction', bool);

        if (bool === false) {
            document.body.classList.toggle('toggleAction');
        }

        var target = currentState.stepElt;
        var medias = $$('video, audio', target);

        medias.forEach(function (media) {
            if (bool) {
                media.playbackRate = media.dataset.playbackrate || 1.0;
                media.play && media.play();
            } else {
                media.pause && media.pause();
                // media.currentTime = 0;
            }
        });
    }

    function setCursorOnBody() {
        setAttribute(document.body, 'data-cursor', currentState.cursor);
        setAttribute(document.body, 'data-previous-cursor', currentState.previousCursor);
        setAttribute(document.body, 'data-next-cursor', currentState.nextCursor);
    }

    function setAttribute(node, name, value) {
        if (value != null) {
            node.setAttribute(name, value);
        } else {
            node.removeAttribute(name);
        }
    }

    function fitTitle() {

        var elements = [].slice.call(document.querySelectorAll('.fit-title > *')),
            max = 750;

        elements.forEach(function (elt) {

            if (elt.style.fontSize === '') {

                var width = elt.offsetWidth,
                    currentFontSize = parseInt(getComputedStyle(elt).fontSize, 10),
                    newFontSize = ((max / width) * currentFontSize).toFixed(3);

                elt.style.fontSize = newFontSize + 'px';
            }
        });

        var smallElements = [].slice.call(document.querySelectorAll('.fit-title--small > *')),
            smallMax = 500;

        smallElements.forEach(function (elt) {

            if (elt.style.fontSize === '') {

                var width = elt.offsetWidth,
                    currentFontSize = parseInt(getComputedStyle(elt).fontSize, 10),
                    newFontSize = ((smallMax / width) * currentFontSize).toFixed(3);

                elt.style.fontSize = newFontSize + 'px';
            }
        });
    }

    function sendState() {
        if (messageSource != null) {
            messageSource.postMessage(['state', {
                cursor: currentState.cursor,
                step: currentState.step,
                previousCursor: currentState.previousCursor,
                nextCursor: currentState.nextCursor,
                notes: currentState.notes
            }], '*');
        }
    }

    function goToFirstCursor() {
        loadCursorInHref(states[0].cursor);
    }

    function goToPreviousCursor() {
        var previousIdx = currentStateIdx - 1;
        if (0 <= previousIdx) {
            loadCursorInHref(states[previousIdx].cursor);
        }
    }

    function goToNextCursor() {
        var nextIdx = currentStateIdx + 1;
        if (nextIdx < states.length) {
            loadCursorInHref(states[nextIdx].cursor);
        }
    }

    function goToLastCursor() {
        loadCursorInHref(states[states.length - 1].cursor);
    }

    function toggleOverview() {

        overviewEnabled = !overviewEnabled;

        document.body.parentNode.setAttribute('data-mode', overviewEnabled ? 'overview' : 'view');
        toggleMultimedia(document.body, true);
        resizeAndCenterBody();
        setTimeout(fitTitle, 10);
    }

    function getNotes(slideElt) {
        return $$('[role="note"]', slideElt).map(function (node) {
            return node.textContent;
        });
    }

    window.addEventListener('resize', resizeAndCenterBody);

    window.addEventListener('hashchange', function (e) {
        readCursorFromUrl(e.newURL);
    });

    function onKey(e, keyCodes, fn) {
        if (keyCodes.indexOf(e.keyCode) !== -1) {
            e.preventDefault();
            fn();
        }
    }

    window.addEventListener('keydown', function (e) {

        document.body.classList.add('no-transition');

        // 36 : home
        onKey(e, [36], goToFirstCursor);

        // 37 : left arrow, 38 : up arrow, 33 : page up
        onKey(e, [37, 38, 33, 75], goToPreviousCursor);

        // 39 : right arrow, 40 : down arrow, 34 : page down
        onKey(e, [39, 40, 34, 188], goToNextCursor);

        // 35 : end
        onKey(e, [35], goToLastCursor);

        // 79 : "o"
        onKey(e, [79], toggleOverview);

        // 32 : space
        onKey(e, [32], toggleMultimedia);

        // 73 : "i"
        onKey(e, [73], triggerAction.bind(this, true));
    });

    window.addEventListener('keyup', function (e) {

        // 73 : "i"
        onKey(e, [73], triggerAction.bind(this, false));
    });

    window.addEventListener('keyup', function () {
        document.body.classList.remove('no-transition');
    });

    document.body.classList.add('no-transition');

    window.addEventListener('click', function (e) {
        if (overviewEnabled && e.target.step != null) {
            loadCursorInHref(e.target.step);
            toggleOverview();
        }
    });

    window.addEventListener('DOMContentLoaded', function () {

        var node = document.createElement('div');

        $$('section').forEach(function (stepElt, stepIdx, stepElts) {

            var fragmentParentElts = $$('.incremental', stepElt),
                fragmentElts = [node].concat($$('.incremental > *', stepElt));

            fragmentElts.forEach(function (fragmentElt, fragmentIdx) {

                var state = {
                    cursor: (stepIdx + 1) + '.' + fragmentIdx,
                    step: (stepIdx + 1) + '.0',
                    notes: getNotes(stepElt),
                    stepElt: stepElt,
                    previousStepElt: stepElts[stepIdx - 1] || node,
                    nextStepElt: stepElts[stepIdx + 1] || node,
                    fragmentParentElts: fragmentParentElts,
                    fragmentElts: fragmentElts.slice(1),
                    selectedFragmentElt: fragmentElt
                };

                stepElt.step = state.step;

                states.push(state);
                statesByCursor[state.cursor] = state;
                statesBySteps[state.step] = state;

                if (states.length > 1) {
                    state.previousCursor = states[states.length - 2].cursor;
                    states[states.length - 2].nextCursor = state.cursor;
                }
            });
        });

        resizeAndCenterBody();
        readCursorFromUrl(window.location.href);

        document.body.parentNode.setAttribute('data-mode', 'view');
    });

    // prezento protocol
    window.addEventListener('message', function (e) {

        var action = e.data[0],
            arg = e.data[1];

        var messageHandlers = {
            goTo: loadCursorInHref,
            first: goToFirstCursor,
            prev: goToPreviousCursor,
            next: goToNextCursor,
            last: goToLastCursor,
            toggleOverview: toggleOverview,
            toggleMultimedia: toggleMultimedia,
            triggerAction: triggerAction
        };

        if (action === 'init') {

            embedded = true;
            mediaEnabled = (arg && arg.enableMedia);

            if (mediaEnabled) {
                $$('video, audio', document.body).forEach(function (media) {
                    media.preload = 'auto';
                });
            }

            var metas = {};
            $$('meta').forEach(function (meta) {
                metas[meta.name] = meta.content;
            });

            messageSource = e.source;
            messageSource.postMessage(['ready', {
                title: document.title,
                metas: metas,
                steps: Object.keys(statesBySteps),
                features: ['multimedia', 'overview', 'notes']
            }], '*');
            sendState();
        }

        if (action in messageHandlers) {
            messageHandlers[action](arg);
        }
    });
})();
