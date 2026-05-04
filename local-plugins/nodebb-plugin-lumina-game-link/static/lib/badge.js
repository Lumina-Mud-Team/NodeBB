'use strict';

// Decora i nick con un badge dal game server (admin/gm/player).
// Cache in-memory per evitare round-trip ripetuti per lo stesso uid.

(function () {
    const ROLE_LABELS = {
        admin:  { icon: '👑', label: 'Admin' },
        gm:     { icon: '🛡️', label: 'GM' },
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
        span.textContent = ' ' + meta.icon;
        return span;
    }

    function findUsernameAnchor(scope) {
        // Harmony renders the post author as <a href="/user/<slug>"> in the post header.
        // Pick the FIRST one (the author link). Slot the badge right after it.
        return scope.querySelector('a[href^="/user/"]');
    }

    function decoratePost(postEl) {
        if (postEl.dataset.luminaBadged === '1') return;
        const uid = postEl.getAttribute('data-uid')
            || postEl.querySelector('[data-uid]')?.getAttribute('data-uid');
        if (!uid) return;

        const anchor = findUsernameAnchor(postEl);
        if (!anchor) return;

        postEl.dataset.luminaBadged = '1';
        fetchRole(uid).then(({ role, username }) => {
            const badge = buildBadge(role, username);
            if (badge && !anchor.nextSibling?.classList?.contains?.('lumina-badge')) {
                anchor.after(badge);
            }
        });
    }

    function scan(root) {
        const scope = root || document;
        // Posts: covered by [component="post"] in Harmony, with data-uid as attr.
        scope.querySelectorAll('[component="post"]').forEach(decoratePost);
        // User cards / profile pages: container has data-uid.
        scope.querySelectorAll('[component="user/header"], [component="user/info"]').forEach(decoratePost);
    }

    // Wait for jQuery (NodeBB always loads it) then bind.
    function bind() {
        if (typeof window.$ === 'undefined') {
            return setTimeout(bind, 100);
        }
        $(document).ready(() => scan(document));
        $(window).on('action:posts.loaded action:topic.loaded action:topics.loaded action:ajaxify.end', () => scan(document));
        // Also scan on dynamic post insertions (infinite scroll).
        $(window).on('action:posts.created action:posts.edited', () => scan(document));
    }
    bind();
})();
