'use strict';

// Lumina is a child theme of Harmony — re-export Harmony's library so
// all of its hooks (admin settings page, profile theme tab, widget
// areas, sidebar/chat/quick-reply config) keep working when Lumina is
// the active theme. plugin.json mirrors Harmony's hook registration
// against these same methods.
module.exports = require('nodebb-theme-harmony');
