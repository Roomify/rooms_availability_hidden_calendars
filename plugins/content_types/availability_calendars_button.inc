<?php

/**
 * @file
 * Availability calendars show/hide button.
 * Create a simple block with text and specific class to
 * simply hide/show availability calendars.
 */

$plugin = array(
  'title' => t('Availability Calendars button'),
  'description' => t("Button to show and hide availability calendars on the page"),
  'category' => t('Miscellaneous'),
  'render callback' => 'availability_three_calendars_button',
);

/**
 * Render callback for the plugin.
 */
function availability_three_calendars_button($subtype, $conf, $args, $context) {
  $block = new stdClass();

  $content = '<div class="availability_calendars_button"> <a href="#" onclick="return false;">' . t('Check Availability') . '</a></div>';

  $block->content = $content;
  $block->id = 'availability_three_calendars_button';

  return $block;
}
