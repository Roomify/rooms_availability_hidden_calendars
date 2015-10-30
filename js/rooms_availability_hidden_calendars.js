(function ($) {

Drupal.behaviors.roomsAvailabilityThreeCalendars = {
  attach: function(context) {

    $('.rooms-hidden-calendars-booking-form .form-submit').attr('disabled', 'disabled');
    $('.rooms-hidden-calendars-booking-form #edit-unit-enquiry').removeAttr('href');

    $('.rooms-hidden-calendars-booking-form .rooms-date-range input').bind('keyup change', function () {
      $form = $(this).closest("form");
      if ($('.end-date input', $form).val() && $('.start-date input', $form).val()) {
        $('.rooms-hidden-calendars-booking-form .form-submit').removeAttr('disabled').focus();
        $start = $('.start-date input', $form).val();
        $end = $('.end-date input', $form).val();
        $start = $start.replace(/\//g, '-');
        $end = $end.replace(/\//g, '-');

        $('.rooms-hidden-calendars-booking-form #edit-unit-enquiry').attr('href', '/?q=contact/' + $start + '/' + $end);
      }
    });

    unit_id = Drupal.settings.roomsAvailability.roomID;

    // Convert php current month to js (which counts months starting from 0).
    currentMonth = Drupal.settings.roomsCalendar.currentMonth - 1;
    currentYear = Drupal.settings.roomsCalendar.currentYear;
    firstDay = Drupal.settings.roomsCalendar.firstDay;

    // The first month on the calendar
    month1 = currentMonth;
    year1 = currentYear;

    // Second month is the next one obviously unless it is 11 in which case we need to move a year ahead
    if (currentMonth == 11) {
      month2 = 0;
      year2 = year1 + 1;
    }
    else{
      month2 = currentMonth+1;
      year2 = currentYear;
    }

    currentMonth = month2;
    // And finally the last month where we do the same as above worth streamlining this probably
    if (currentMonth == 11) {
      month3 = 0;
      year3 = year2 + 1;
    }
    else{
      month3 = currentMonth+1;
      year3 = year2;
    }

    var calendars = [];
    calendars[0] = new Array('#calendar', month1, year1);
    calendars[1] = new Array('#calendar1', month2, year2);
    calendars[2] = new Array('#calendar2', month3, year3);

    events = [];
    var url = Drupal.settings.basePath + '?q=bat/v1/availability&units=' + unit_id + '&start_date=' + year1 + '-' + (month1+1) + '-01&duration=3M';
    $.ajax({
      url: url,
      success: function(data) {
        events = data['events'];

        $.each(calendars, function(key, value) {
          $(value[0]).fullCalendar('refetchEvents');
        });
      }
    });

    $.each(calendars, function(key, value) {
      // phpmonth is what we send via the url and need to add one since php handles
      // months starting from 1 not zero
      phpmonth = value[1]+1;
      $(value[0]).once().fullCalendar({
        ignoreTimezone: false,
        editable: false,
        selectable: true,
        handleWindowResize: true,
        dayNamesShort: [Drupal.t("Sun"), Drupal.t("Mon"), Drupal.t("Tue"), Drupal.t("Wed"), Drupal.t("Thu"), Drupal.t("Fri"), Drupal.t("Sat")],
        monthNames: [Drupal.t("January"), Drupal.t("February"), Drupal.t("March"), Drupal.t("April"), Drupal.t("May"), Drupal.t("June"), Drupal.t("July"), Drupal.t("August"), Drupal.t("September"), Drupal.t("October"), Drupal.t("November"), Drupal.t("December")],
        firstDay: firstDay,
        defaultDate: moment([value[2],phpmonth-1]),
        height: 1,
        header:{
          left: 'title',
          center: '',
          right: ''
        },
        windowResize: function(view) {
          $(value[0]).fullCalendar('refetchEvents');
        },
        events: function(start, end, timezone, callback) {
          callback(events[unit_id]);
        },
        select: function(start, end, allDay) {
          end = end.subtract(1, 'day');
          var sd = start.format('DD/MM/YYYY');
          var ed = end.format('DD/MM/YYYY');

          // If the start date and end date are the same, assume checkout
          // on the following day.
          if (sd == ed) {
            end = end.add(1, 'day');
            ed = end.format('DD/MM/YYYY');
          }
          constraintMessages(start, end);
          $('.rooms-hidden-calendars-booking-form .start-date input').val(sd);
          $('.rooms-hidden-calendars-booking-form .start-date input').datepicker('setDate', start);

          $('.rooms-hidden-calendars-booking-form .end-date input').val(ed);
          $('.rooms-hidden-calendars-booking-form .end-date input').datepicker('setDate', end);

          $('.rooms-hidden-calendars-booking-form .form-submit').removeAttr('disabled').focus();
          $('.rooms-hidden-calendars-booking-form #edit-unit-enquiry').attr('href', '/?q=contact/' + start.format('DD-MM-YYYY') + '/' + end.format('DD-MM-YYYY'));

        },
        //Remove Time from events.
        eventRender: function(event, el) {
          el.find('.fc-time').remove();
          // Checking if user is administrator or rooms manager.
          if (Drupal.settings.user_is_administrator) {
            // Add a class if the event start it is not "AV" or "N/A".
            if (el.hasClass('fc-start') && this.id != 1 && this.id != 0) {
              el.append('<div class="event-start"/>');
              el.find('.event-start').css('border-top-color', this.color);
            }

            // Add a class if the event end and it is not "AV" or "N/A".
            if (el.hasClass('fc-end') && this.id != 1 && this.id != 0) {
              el.append('<div class="event-end"/>');
              el.find('.event-end').css('border-top-color', this.color);
            }
          }
        },
        eventAfterRender: function(event, element, view) {
          // Hide events that are outside this month.
          if (event.start.month() != view.intervalStart.month()) {
            element.css('visibility', 'hidden');
            return;
          }

          // Event width.
          var width = element.parent().width()
          // Event colspan number.
          var colspan = element.parent().get(0).colSpan;
          // Single cell width.
          var cell_width = width/colspan;
          var half_cell_width = cell_width/2;
          // Adding a class to the second row of events to use for theme.
          element.closest('tbody').find('tr:eq(1) .fc-content').addClass('rooms-calendar-second-row-events');

          // Move events between table margins.
          element.css('margin-left', half_cell_width);
          element.css('margin-right', half_cell_width);

          // Calculate width event to add end date triangle.
          width_event = element.children('.fc-content').width();

          // Add a margin left to the top triangle.
          element.children().closest('.event-end').css('margin-left', width_event - 15);

          // If the event end in a next row.
          if(element.hasClass('fc-not-end')) {
            element.css('margin-right', 0);
          }
          // If the event start in a previous row.
          if(element.hasClass('fc-not-start')) {
            // Fixes to work well with jquery 1.7.
            if (colspan == 1) {
              width_event = 0;
            }
            element.css('margin-left', 0);
            element.children().closest('.event-end').css('margin-left', ((colspan - 1) * cell_width) + half_cell_width - 15);
          }
        }
      });
    });
    // Highligth cells on hover
    $('.fc-day-number').hover(
      function() {
        $(this).addClass('is-hovered');
        var day_cell = $(this).closest('.fc-day-grid-container').find(".fc-bg td[data-date='" + $(this).data('date') + "']");
        $(day_cell).addClass('is-hovered');
      }, function() {
        $(this).removeClass('is-hovered');
        var day_cell = $(this).closest('.fc-day-grid-container').find(".fc-bg td[data-date='" + $(this).data('date') + "']");
        $(day_cell).removeClass('is-hovered');
      }
    );
    // Adding a custom class for theming.
    $('.rooms-three-month-calendar').addClass('availability-three-calendar-block');

    // Show/hide calendars on button click.
    if (!($('body').hasClass('casa-custom-booking-page'))) {
      $(".availability_calendars_button a").once().click(function() {
        var $target = $('.availability-three-calendar-block'),
        $toggle = $(this);
        $target.slideToggle( 400, function () {
          $toggle.text(($target.is(':visible') ? 'Close Calendars' : 'Check Availability'));
          if ($('body').hasClass('page-booking') && $target.is(':visible')) {
            // Scroll to Calendars;
            $('html, body').animate({
             scrollTop: $(".rooms-hidden-calendars-booking-form").offset().top
            }, 300);
          }
        });
        // Refresh calendars
        $('#calendar').fullCalendar('refetchEvents');
        $('#calendar1').fullCalendar('refetchEvents');
        $('#calendar2').fullCalendar('refetchEvents');
      });
    }
  function constraintMessages(start, end) {
    var availabilityConstraints = Drupal.settings.availabilityConstraints;
    var nights = end.diff(start, 'days');
    var message = '';
    $.each(availabilityConstraints, function(key, value) {
      constraintStart = moment(value.start_date);
      constraintEnd = moment(value.end_date);
      // Selected dates are between constraint's dates.
      if (betweenConstraint(start, end, constraintStart, constraintEnd)) {
        // Simple constraint type.
        if (value.constraint_type == 'none') {
          // The constraint has a start date and an end date.
          if (value.always == 0) {
            if (value.minimum_stay != null && nights < value.minimum_stay) {
              message += Drupal.t('- From @start to @end the stay must be for at least @minimum nights', {
                '@start' : constraintStart.format('DD/MM/YYYY'),
                '@end' : constraintEnd.format('DD/MM/YYYY'),
                '@minimum' : value.minimum_stay,
              });
              message += '\n';
            }
            if (value.maximum_stay != null && nights > value.maximum_stay) {
              message += Drupal.t('- From @start to @end the stay must be for at most @maximum nights', {
                '@start' : constraintStart.format('DD/MM/YYYY'),
                '@end' : constraintEnd.format('DD/MM/YYYY'),
                '@maximum' : value.maximum_stay,
              });
              message += '\n';
            }
          }
          // The constraint has not a start date and an end date.
          if (value.always == 1) {
            if (value.minimum_stay != null && nights < value.minimum_stay) {
              message += Drupal.t('- The stay must be for at least @minimum nights', {
                '@minimum' : value.minimum_stay,
                });
              message += '\n';
            }
            if (value.maximum_stay != null && nights > value.maximum_stay) {
              message += Drupal.t('- The stay cannot be more than @maximum nights', {
                '@maximum' : value.maximum_stay,
              });
              message += '\n';
            }
          }
        }
        // "If" constraint type: If booking starts on a specific day.
        if (value.constraint_type == 'if') {
          // Moment use 0 for sunday.
          if (value.start_day == 7) {
           startingOn = 0;
          }
          else {
            startingOn = value.start_day;
          }
          // Selected start date is the same of the constraint.
          if (startingOn == start.format('e')) {
            if (value.always == 0) {
              // There is an availability constraint here.
              if (value.minimum_stay != null && nights < value.minimum_stay) {
                message += Drupal.t('- If booking starts on @day from @start to @end, the stay must be for at least @minimum nights', {
                  '@day' : getDayName(start.format('e')),
                  '@start' : constraintStart.format('DD/MM/YYYY'),
                  '@end' : constraintEnd.format('DD/MM/YYYY'),
                  '@minimum' : value.minimum_stay,
                });
                message += '\n';
              }
              if (value.maximum_stay != null && nights > value.maximum_stay) {
               message += Drupal.t('- If booking starts on @day from @start to @end, the stay must be for at most @maximum nights', {
                  '@day' : getDayName(start.format('e')),
                  '@start' : constraintStart.format('DD/MM/YYYY'),
                  '@end' : constraintEnd.format('DD/MM/YYYY'),
                  '@maximum' : value.maximum_stay,
                });
                message += '\n';
              }
            }
            if (value.always == 1) {
              if (value.minimum_stay != null && nights < value.minimum_stay) {
                  message += Drupal.t('- If booking starts on @day the stay must be for at least @minimum nights', {
                    '@day' : getDayName(start.format('e')),
                    '@minimum' : value.minimum_stay,
                  });
                  message += '\n';
                }
              if (value.maximum_stay != null && nights > value.maximum_stay) {
               message += Drupal.t('- If booking starts on @day the stay must be for at most @maximum nights', {
                  '@day' : getDayName(start.format('e')),
                  '@maximum' : value.maximum_stay,
                });
                message += '\n';
              }
            }
          }
        }
        // "Must" constraint type: Booking must starts on a specific day.
        if (value.constraint_type == 'must') {
          // moment use 0 for sunday.
          if (value.start_day == 7) {
            startingOn = 0;
          }
          else {
            startingOn = value.start_day;
          }
          if (value.always == 0) {
            if (startingOn != start.format('e') || (value.minimum_stay != null && nights < value.minimum_stay) || (value.maximum_stay != null && nights > value.maximum_stay)) {
              message += Drupal.t('- From @start to @end booking must starts on @day', {
                '@start' : constraintStart.format('DD/MM/YYYY'),
                '@end' : constraintEnd.format('DD/MM/YYYY'),
                '@day' : getDayName(startingOn),
                });
              // Booking must be of a specific number of nights
              if (value.maximum_stay == value.minimum_stay) {
                if (value.maximum_stay != nights) {
                  message += Drupal.t('; stay must be of @number nights', {
                    '@number' : value.maximum_stay,
                  });
                }
              }
              else {
                if (value.minimum_stay != null && nights < value.minimum_stay) {
                  message += Drupal.t('; stay must be for at least @minimum nights', {
                    '@minimum' : value.minimum_stay,
                  });
                }
                if (value.maximum_stay != null && nights > value.maximum_stay) {
                  message += Drupal.t('; stay must be for at most @maximum nights', {
                    '@maximum' : value.maximum_stay,
                  });
                }
              }
            }
          }
          if (value.always == 1) {
            if (startingOn != start.format('e') || (value.minimum_stay != null && nights < value.minimum_stay) || (value.maximum_stay != null && nights > value.maximum_stay)) {
              message += Drupal.t('- Bookings must starts on @day', {
                  '@day' : getDayName(startingOn),
                  });
              // Booking must be of a specific number of nights
              if (value.maximum_stay == value.minimum_stay) {
                if (value.maximum_stay != nights) {
                  message += Drupal.t('; stay must be of @number nights', {
                    '@number' : value.maximum_stay,
                  });
                }
              }
              else {
                if (value.minimum_stay != null && nights < value.minimum_stay) {
                    message += Drupal.t('; stay must be for at least @minimum nights', {
                      '@minimum' : value.minimum_stay,
                    });
                  }
                if (value.maximum_stay != null && nights > value.maximum_stay) {
                 message += Drupal.t('; stay must be for at most @maximum nights', {
                    '@maximum' : value.maximum_stay,
                  });
                }
              }
            }
          }
        }
      }
    });
    if (message != '') {
      alert(message);
    }
  }

  function betweenConstraint(start,end, constraintStart, constraintEnd) {
    if ((start.isBetween(constraintStart, constraintEnd) || start.isSame(constraintStart, 'day'))  && (end.isBetween(constraintStart, constraintEnd) || end.isSame(constraintEnd, 'day'))) {
      return true;
    }
    else {
      return false;
    }
  }
  function getDayName(day) {
      switch (day) {
        case '1' : return Drupal.t('Monday');
        case '2' : return Drupal.t('Tuesday');
        case '3' : return Drupal.t('Wednesday');
        case '4' : return Drupal.t('Thursday');
        case '5' : return Drupal.t('Friday');
        case '6' : return Drupal.t('Saturday');
        case '0' : return Drupal.t('Sunday');
      }
    }
  }
}
})(jQuery);
