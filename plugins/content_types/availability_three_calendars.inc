<?php

/**
 * @file
 * Availability Calendars.
 * Create a simple block with three availability calendars.
 */

$plugin = array(
  'title' => t('Availability Three Calendars'),
  'description' => t("Displays availability information on three calendars without use a popup."),
  'category' => t('Miscellaneous'),
  'render callback' => 'availability_three_calendars_render',
);

/**
 * Render callback for the plugin.
 */
function availability_three_calendars_render($subtype, $conf, $args, $context) {
  $block = new stdClass();

  // Default unit is 1;
  $unit_id = 1;
  $date_current = new DateTime("now");

  $year = $date_current->format('Y');
  $month = $date_current->format('n');
  $element = availability_three_calendars($unit_id, $year, $month);

  $block->content = $element;
  $block->title = '';
  $block->id = 'availability_three_calendars';

  return $block;
}
