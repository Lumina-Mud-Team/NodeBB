'use strict';

// Lumina is a child theme of Harmony — re-export Harmony's library so
// all of its hooks (admin settings page, profile theme tab, widget
// areas, sidebar/chat/quick-reply config) keep working when Lumina is
// the active theme. plugin.json mirrors Harmony's hook registration
// against these same methods.
//
// `require.main.require` risolve da NodeBB stesso (loader.js), così
// funziona anche quando questo file è caricato attraverso un junction/
// symlink da una directory che non ha node_modules proprie (es. worktree
// di sviluppo). Senza questo trick, in worktree il plugin fallisce con
// "Cannot find module 'nodebb-theme-harmony'" e config.theme resta null
// → enableBreadcrumbs (e tutti gli altri toggle harmony) si comportano
// come undefined → breadcrumbs spariscono dalle pagine.
module.exports = require.main.require('nodebb-theme-harmony');
