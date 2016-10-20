'use strict';

window.onload = function (argument) {

    function qsOne(selector, parent) {
        return parent.querySelector(selector);
    }

    function qsAll(selector, parent) {
        return [].slice.call(parent.querySelectorAll(selector));
    }

    function createInputRange(min, max, inputListener) {

        var range = document.createElement('input');

        range.type = 'range';
        range.min = min;
        range.max = max;
        range.value = max;
        range.classList.add('interactiveSvg-range');

        range.addEventListener('input', inputListener);
        range.addEventListener('update', inputListener);

        return range;
    }

    function createPlayButton(clickListener) {

        var button = document.createElement('button');

        button.classList.add('interactiveSvg-play');
        // button.innerHTML = 'PLAY';

        button.addEventListener('click', clickListener);

        return button;
    }

    function parseList(expression) {

        return expression.split('|').map(function (item) {
            return item.trim();
        });
    }

    function parseScenarioInterval(intervalOrItem) {

        // 0
        // (0)
        // 0-3
        // (0)-3
        // 0-(3)
        // (0-3)
        var intervalPattern = new RegExp([
            '^',
            '(\\()?',
            '([0-9]+)',
            '(\\))?',
            '(-)?',
            '(\\()?',
            '([0-9]+)?',
            '(\\))?',
            '$'
        ].join(''));

        var parsedIntervalOrItem = intervalPattern.exec(intervalOrItem);

        var start = parseInt(parsedIntervalOrItem[2]);
        var startIsHighlighted = parsedIntervalOrItem[1] === '(';

        var isInterval = (parsedIntervalOrItem[4] === '-' && parsedIntervalOrItem[6] != null);

        var items = {};

        items[start] = ['bespoke-build-active'];
        if (startIsHighlighted) {
            items[start] = 'bespoke-build-highlight';
        }

        if (isInterval) {

            var end = parseInt(parsedIntervalOrItem[6]);
            var endIsHighlighted = parsedIntervalOrItem[7] === ')';

            items[end] = ['bespoke-build-active'];
            if (endIsHighlighted) {
                items[end] = 'bespoke-build-highlight';
            }

            for (var i = start; i < end; i++) {
                items[i] = ['bespoke-build-active'];
                if (startIsHighlighted && endIsHighlighted) {
                    items[i] = 'bespoke-build-highlight';
                }
            }
        }

        return items;
    }

    function parseScenarioStep(expression) {

        return expression.split(';')
            .map(function (stepIntervalOrItem) {
                return parseScenarioInterval(stepIntervalOrItem);
            })
            .reduce(function (a, b) {
                for (var i in b) {
                    if (b != null && b[i] != null) {
                        a[i] = b[i];
                    }
                }
                return a;
            }, {});
    }

    function displayStep(allItems, stepItems) {

        allItems.forEach(function (part, idx) {

            part.classList.remove('bespoke-build-active');
            part.classList.remove('bespoke-build-highlight');
            part.classList.add('bespoke-build-inactive');

            if (idx in stepItems) {
                part.classList.add(stepItems[idx]);
                part.classList.remove('bespoke-build-inactive');
            }
        });
    }

    function makeInteractive(interactiveSvgParent) {

        qsAll('[style="display:none"]', interactiveSvgParent).forEach(function (layer) {
          layer.removeAttribute('style');
        });

        qsAll('path', interactiveSvgParent).forEach(function (path) {
            var da = path.style.strokeDasharray;
            if (da === 'none') {

                var length = path.getTotalLength();
                path.style.strokeDasharray = (length + 10) + ' ' + (length + 10);
                path.style.strokeDashoffset = (length + 15);

                if (parseInt(length) < 80) {
                    path.classList.add('interactiveSvg-short')
                }
                else {
                    path.classList.add('interactiveSvg-long')
                }
            }
        });

        var allItems = parseList(interactiveSvgParent.dataset.items)
            .map(function (selector) {
                var node = qsOne('#' + selector, interactiveSvgParent);
                if (node == null) {
                  throw new Error('cannot find #' + selector);
                }
                return node;
            });

        var scenarioSteps = parseList(interactiveSvgParent.dataset.scenario)
            .map(function (stepExpression) {
                return parseScenarioStep(stepExpression);
            });

        displayStep(allItems, scenarioSteps[scenarioSteps.length - 1]);

        var range = createInputRange(0, scenarioSteps.length - 1, function () {

            var stepNumber = parseInt(range.value);
            var stepItems = scenarioSteps[stepNumber];

            displayStep(allItems, stepItems);
        });

        var playButton = createPlayButton(function () {

            for (var i = 0; i < scenarioSteps.length; i++) {
                (function (ii) {
                    setTimeout(function () {
                        range.value = ii;
                        displayStep(allItems, scenarioSteps[ii]);
                    }, ii * 1000);
                })(i);
            }

            playButton.parentElement.removeChild(playButton);
        });

        interactiveSvgParent.appendChild(range);
        interactiveSvgParent.appendChild(playButton);
    }

    qsAll('.interactive [data-items][data-scenario]', document)
        .forEach(makeInteractive);

    // $('.openblock .title').balanceText();
}
