'use strict';

// Decora ogni post con:
//   - badge ruolo accanto al nick (👑/🛡️/⚔️)
//   - riga compatta con i PG dell'autore sotto il contenuto del post
// Cache in-memory per evitare round-trip ripetuti per lo stesso uid.

(function () {
    const ROLE_LABELS = {
        admin:  { icon: '👑', label: 'Admin' },
        gm:     { icon: '🛡️', label: 'GM' },
        player: { icon: '⚔️', label: 'Player' },
    };

    const STATUS_LABELS = {
        idle:        '🟢',
        in_combat:   '⚔️',
        travelling:  '🧭',
        dead:        '💀',
        resting:     '💤',
    };

    const roleCache = new Map();      // uid -> Promise<{role, username}>
    const charsCache = new Map();     // uid -> Promise<{characters, reveal}>

    function fetchRole(uid) {
        if (!roleCache.has(uid)) {
            roleCache.set(uid, fetch('/api/lumina/role/' + uid, { credentials: 'same-origin' })
                .then(r => r.ok ? r.json() : { role: null })
                .catch(() => ({ role: null })));
        }
        return roleCache.get(uid);
    }

    function fetchCharacters(uid) {
        if (!charsCache.has(uid)) {
            charsCache.set(uid, fetch('/api/lumina/characters/' + uid, { credentials: 'same-origin' })
                .then(r => r.ok ? r.json() : { characters: [], reveal: false })
                .catch(() => ({ characters: [], reveal: false })));
        }
        return charsCache.get(uid);
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

    function buildCharactersRow(characters) {
        if (!characters || !characters.length) return null;
        const row = document.createElement('div');
        row.className = 'lumina-pg-row';
        const label = document.createElement('span');
        label.className = 'lumina-pg-label';
        label.textContent = '👤 PG: ';
        row.appendChild(label);
        characters.forEach((c, i) => {
            if (i > 0) {
                const sep = document.createElement('span');
                sep.className = 'lumina-pg-sep';
                sep.textContent = ' · ';
                row.appendChild(sep);
            }
            const item = document.createElement('span');
            item.className = 'lumina-pg-item';
            const status = STATUS_LABELS[c.status] || '';
            item.textContent = `${status} ${c.name || '?'} (${c.class || '?'} lvl ${c.level || 1})`;
            item.setAttribute('title', `${c.race || ''} ${c.class || ''} — status: ${c.status || 'unknown'}`);
            row.appendChild(item);
        });
        return row;
    }

    function findUsernameAnchor(scope) {
        // Harmony: l'anchor del nick è l'unico con data-uid (gli altri /user/ anchor
        // sono wrappers dell'avatar senza data-uid).
        return scope.querySelector('a[href^="/user/"][data-uid]')
            || scope.querySelector('a[href^="/user/"][data-username]');
    }

    function findPostContentEl(postEl) {
        return postEl.querySelector('[component="post/content"]')
            || postEl.querySelector('.content')
            || postEl;
    }

    function decoratePost(postEl) {
        if (postEl.dataset.luminaDecorated === '1') return;
        const uid = postEl.getAttribute('data-uid')
            || postEl.querySelector('[data-uid]')?.getAttribute('data-uid');
        if (!uid) return;
        postEl.dataset.luminaDecorated = '1';

        // Badge ruolo accanto al nick.
        const anchor = findUsernameAnchor(postEl);
        if (anchor) {
            fetchRole(uid).then(({ role, username }) => {
                const badge = buildBadge(role, username);
                if (badge) anchor.after(badge);
            });
        }

        // Riga PG sotto il contenuto del post.
        const content = findPostContentEl(postEl);
        if (content) {
            fetchCharacters(uid).then(({ characters, reveal }) => {
                if (!reveal) return;
                const row = buildCharactersRow(characters);
                if (row) content.appendChild(row);
            });
        }
    }

    function scan(root) {
        const scope = root || document;
        scope.querySelectorAll('[component="post"]').forEach(decoratePost);
    }

    function bind() {
        if (typeof window.$ === 'undefined') {
            return setTimeout(bind, 100);
        }
        $(document).ready(() => scan(document));
        $(window).on('action:posts.loaded action:topic.loaded action:topics.loaded action:ajaxify.end action:posts.created action:posts.edited', () => scan(document));
    }
    bind();
})();
