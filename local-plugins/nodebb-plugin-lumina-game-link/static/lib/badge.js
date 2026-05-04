'use strict';

// Decora i nick con un badge che mostra il ruolo dal game server (admin/gm/player).
// Cache in-memory per evitare round-trip ripetuti per lo stesso uid.
//
// Strategy: ogni volta che NodeBB renderizza nuovi post o utenti, scansiona il DOM
// per trovare elementi con [data-uid] e fa una fetch a /api/lumina/role/:uid.

(function () {
    const ROLE_LABELS = {
        admin: { icon: '👑', label: 'Admin' },
        gm:    { icon: '🛡️', label: 'GM' },
        player: { icon: '⚔️', label: 'Player' },
    };

    const cache = new Map(); // uid -> Promise<{role, username}>

    function fetchRole(uid) {
        if (!cache.has(uid)) {
            cache.set(uid, fetch('/api/lumina/role/' + uid, { credentials: 'same-origin' })
                .then(r => r.ok ? r.json() : { role: null })
                .catch(() => ({ role: null })));
        }
        return cache.get(uid);
    }

    function buildBadge(role, username) {
        const meta = ROLE_LABELS[role];
        if (!meta) return null;
        const span = document.createElement('span');
        span.className = 'lumina-badge lumina-badge--' + role;
        span.setAttribute('title', 'Lumina: ' + (username || '?') + ' — ' + meta.label);
        span.textContent = meta.icon;
        return span;
    }

    function decorate(el) {
        const uid = el.getAttribute('data-uid');
        if (!uid || el.dataset.luminaBadged === '1') return;
        el.dataset.luminaBadged = '1';
        fetchRole(uid).then(({ role, username }) => {
            const badge = buildBadge(role, username);
            if (badge) el.appendChild(badge);
        });
    }

    function scan(root) {
        (root || document).querySelectorAll('[component="post/header"] [data-uid], [component="user/picture"][data-uid], [component="topic/header"] [data-uid]').forEach(decorate);
    }

    // Initial scan + after every NodeBB re-render of posts/topics/users.
    if (typeof $ !== 'undefined') {
        $(document).ready(() => scan(document));
        $(window).on('action:posts.loaded action:topics.loaded action:topic.loaded action:ajaxify.end', () => scan(document));
    } else {
        document.addEventListener('DOMContentLoaded', () => scan(document));
    }
})();
