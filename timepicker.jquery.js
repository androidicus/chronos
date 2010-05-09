(function ($) {
    $.fn.timePicker = function (options) {
        var settings = $.extend({}, $.fn.timePicker.defaults, options); // merges defaults and passed-in options without altering either
        return this.each(function () {
            $.timePicker(this, settings);
        });
    };

    $.timePicker = function (elm, settings) {
        var e = $(elm)[0];
        return e.timePicker || (e.timePicker = new $._timePicker(e, settings));
    };

    $._timePicker = function (elm, settings) {
        var $callingField = $(elm);
        var $timepicker = $('<div class="timepicker"></div>');
        var startTime = new Date(0, 0, 0, 0, 0, 0, 0);
        var endTime = new Date(0, 0, 0, 23, 60 - settings.step, 0, 0);

        //Helper functions
        function findElementMatchingTime() {
            var time = $callingField.data('time') || settings.firstAppt;
            var searchTerm = formatTime(time, settings.militaryTime);
            return $('div:contains(' + searchTerm + '):first', $timepicker);
        }

        function selectElement($el) {
            $('div', $timepicker).removeClass('selected');
            $el.addClass('selected');
        }

        function getNextElement(numToSkip) {
            var elHeight = $('div:first', $timepicker).height();
            var currentPosition = $('.selected', $timepicker).index() * elHeight;
            var projectedPosition = currentPosition + (numToSkip * elHeight);
            var top = 0;
            var bottom = $('div', $timepicker).length * elHeight;

            if (projectedPosition <= top) {
                return $('div:first', $timepicker);
            } else if (projectedPosition >= bottom) {
                return $('div:last', $timepicker);
            } else {
                return $($('div', $timepicker)[projectedPosition / elHeight]);
            }
        }

        function setScrollTop(placeElementAtTop) {
            var $selected = $('div.selected:first', $timepicker);
            var selectedPosition = $selected.index() * $selected.height();

            var above = selectedPosition < $timepicker.scrollTop();
            var below = selectedPosition >= $timepicker.scrollTop() + $timepicker.height();
            var onscreen = !above && !below;

            /* placeElementAtTop is here so that when an onscreen element needs to be placed
            at the top, such as when the timepicker is first being shown and we want to
            scroll to the first appointment, we can manually override the default behavior */
            if (placeElementAtTop) {
                $timepicker.scrollTop(selectedPosition);
            } else {
                if (above) {
                    $timepicker.scrollTop(selectedPosition);
                } else if (onscreen) {
                    return;
                } else if (below) {
                    $timepicker.scrollTop(selectedPosition + $selected.height() - $timepicker.height());
                }
            }
        }

        function showTimepicker() {
            if (true) { // if this isn't the start time
                // Refresh the duration info
                $('div', $timepicker).each(function () {
                    $this = $(this);
                    $this
                        .data('duration', calculateDuration(settings.showDuration.$startTime, $this))
					    .html(formatTime($this.data('time')) + ' ' + formatDuration($this.data('duration')));
                });
            }

            $('.timepicker, .datepicker').hide();

            var offset = $callingField.offset();
            var timepickerWidth = 0;

            /* this must happen before any divs within the timepicker are referenced;
               otherwise, they won't exist and strange things will start happening */
            $timepicker.show();

            //set width to that of the widest div or the calling field's width, whichever is wider
            $('div', $timepicker).each(function () { timepickerWidth = Math.max(timepickerWidth, $(this).outerWidth()); });
            timepickerWidth = Math.max(timepickerWidth, $callingField.outerWidth());

            $timepicker.css({
                'width': timepickerWidth,
                'height': settings.linesPerPage * $('div:first', $timepicker).height() + 'px',
                'top': offset.top + $callingField.outerHeight(),
                'left': offset.left
            });

            selectElement(findElementMatchingTime());
            setScrollTop(true);
        }

        function hideTimepicker() {
            $timepicker.hide();
        }

        function toggleTimepickerVisibility() {
            if (isTimepickerVisible()) {
                hideTimepicker();
            } else {
                showTimepicker();
            }
        }

        function isTimepickerVisible() {
            return $('div:visible', $timepicker).size() > 0;
        }

        function getTime($el) {
            return $el.data('time');
        }

        function setTime(time) {
            $callingField.data('time', time);
        }

        function setTimeFromUserInput() {
            var userInput = $callingField.val();
            var time = timeToDate(userInput);
            setTime(time);
        }

        function formatTime(time) {
            if (time === null) {
                return '';
            }
            if (typeof time === 'string') {
                time = timeToDate(time);
            }
            try {
                if (typeof time !== 'object') {
                    throw "InvalidTypeError";
                } else {
                    return (((time.getHours() + 11) % 12) + 1) +
						   ':' +
						   (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() +
						   ' ' +
						   (time.getHours() < 12 ? 'am' : 'pm');
                }
            }
            catch (e) {
                if (e === "InvalidTypeError") {
                    alert("Parameter 'time' must be either Date or String");
                }
            }
        }

        function timeToDate(time) {
            if (time !== null) {
                var timeRegex = /([0-2]?[0-9]):?([0-5][0-9])?\s*([apAP][mM]?)?/;
                var results = timeRegex.exec(time);

                if (results !== null) {
                    var hours = results[1] !== undefined && results[1] !== null && results[1] !== '' ? parseFloat(results[1]) : 0,
						minutes = results[2] !== undefined && results[2] !== null && results[2] !== '' ? parseFloat(results[2]) : 0,
						meridian = results[3] !== undefined && results[3] !== null && results[3] !== '' ? results[3].toUpperCase() : '';
                    if (meridian === 'PM' && hours < 12) {
                        hours += 12;
                    } else if (meridian === 'AM') {
                        hours %= 12;
                    }
                    return new Date(0, 0, 0, hours, minutes, 0, 0);
                } else {
                    return null;
                }
            }
        }

        function renderCallingField() {
            $callingField.val(formatTime($callingField.data('time')));
        }

        function calculateDuration($startTime, $endTime) {
            /* Takes any two jQuery objects have the data('time') property */
            if ($startTime && $endTime) {
                var startTime = $startTime.data('time');
                var endTime = $endTime.data('time');

                if (startTime && endTime) {
                    return endTime - startTime;
                }
            }

            return null;
        };

        function formatDuration(duration) {
            /* Takes milliseconds and returns a formatted string in hours */
            if (duration === null || duration === 0) {
                return '';
            } else {
                duration = duration / (1000 * 60 * 60);
                return '(' + duration + ' hours)';
            }
        }

        /* Build list of times -- at some point I need to refactor this using event delegation... */
        for (var time = startTime; time <= endTime; time.setMinutes(time.getMinutes() + settings.step)) {
            $timepicker
                .append(
                    $('<div></div>')
                        .data('time', new Date(0, 0, 0, time.getHours(), time.getMinutes(), 0, 0))
						.css({
						    'cursor': 'pointer',
						    'padding': '0 8px 0 2px',
						    'text-align': 'left',
						    'white-space': 'nowrap'
						})
                        .hover(function () { selectElement($(this)); })
                        .click(function () {
                            setTime(getTime($(this)));
                            renderCallingField();
                            // Keep focus for all but IE (which doesn't like it)
                            if (!$.browser.msie) {
                                $callingField.focus();
                            }
                            hideTimepicker();
                        }));
        }

        // Build timepicker
        $timepicker
            .css({
                'font': $callingField.css('font'),
                'position': 'absolute',
                'overflow': 'auto',
                'background': '#FFFFFF',
                'border': '1px solid #ccc',
                'z-index': '99'
            })
            .appendTo('body')
            .hide();

        /* We set the time once initially just in case there
        are any leftover form values in the field */
        setTimeFromUserInput();

        // Set up focus/click handlers
        $callingField
        /* focus and click both need to stop propagation so that their
        * events don't bubble up to the document level and trigger
        * the document.click() behavior (hiding the timepicker, that is) */
            .focus(function (e) {
                toggleTimepickerVisibility();
                e.stopPropagation();
            })
			.click(function (e) { e.stopPropagation(); })
			.blur(function () {
			    setTimeFromUserInput();
			    renderCallingField();
			});

        $(document).click(hideTimepicker);

        // Keyboard navigation
        $callingField.bind('keydown',
            function (e) {
                if (e.which in { 38: 'Up',
                    40: 'Down',
                    33: 'PageUp',
                    34: 'PageDown'
                }) {
                    if (!isTimepickerVisible()) {
                        showTimepicker();
                    } else {
                        var $next;

                        if (e.which === 38) {
                            $next = getNextElement(-1);
                        } else if (e.which === 40) {
                            $next = getNextElement(1);
                        } else if (e.which === 33) {
                            $next = getNextElement(-1 * settings.linesPerPage);
                        } else if (e.which === 34) {
                            $next = getNextElement(1 * settings.linesPerPage);
                        }

                        selectElement($next);
                        setScrollTop();
                    }
                }

                if (e.which in { 13: 'Enter',
                    9: 'Tab',
                    27: 'Esc'
                }) {
                    if (e.which === 13) {
                        if (isTimepickerVisible()) {
                            $('.selected', $timepicker).click();
                        } else {
                            $(this).blur();
                        }
                        e.stopPropagation(); // Otherwise we'll end up submitting the form
                    }

                    if (e.which == 9) {
                        $(this).blur();
                    }

                    hideTimepicker();
                }
            });
        return this;
    };
})(jQuery)
    
// Defaults
$.fn.timePicker.defaults = {
    step: 30,
    firstAppt: new Date(0, 0, 0, 8, 0, 0),
    showDuration: false,
    linesPerPage: 16
};