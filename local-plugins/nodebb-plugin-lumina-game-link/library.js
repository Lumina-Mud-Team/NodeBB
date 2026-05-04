'use strict';

// Bridge tra vhrazul-server (collection rpg_fantasy.players + characters) e NodeBB.
// Espone:
//   GET  /api/lumina/role/:uid       → { role, username }
//   GET  /api/lumina/characters/:uid → { characters, reveal }   (con privacy)
//   GET  /api/lumina/preference      → { hideCharacters }
//   POST /api/lumina/preference      → set { hideCharacters }
//
// Lookup: NodeBB uid → googleSub (via plugin sso-google) → Player → Characters by owner.

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const { MongoClient, ObjectId } = require.main.require('mongodb');
const User = require.main.require('./src/user');

const Plugin = {};
let rpgDb = null;

const PREF_KEY = 'luminaHideCharacters'; // user setting key in NodeBB

async function connectToRpg() {
    const cfg = nconf.get('mongo') || {};
    if (!cfg.host || !cfg.port || !cfg.username || !cfg.password) {
        winston.warn('[lumina-game-link] mongo config not available — game data lookup disabled');
        return;
    }
    const dbName = process.env.RPG_MONGO_DB_NAME || 'rpg_fantasy';
    const params = process.env.RPG_MONGO_DB_PARAMS || '?authSource=admin&ssl=true&retryWrites=true&w=majority';
    const hosts = cfg.host.split(',');
    const ports = cfg.port.toString().split(',');
    const servers = hosts.map((h, i) => `${h}:${ports[i] || ports[0]}`).join(',');
    const uri = `mongodb://${encodeURIComponent(cfg.username)}:${encodeURIComponent(cfg.password)}@${servers}/${dbName}${params}`;

    winston.info(`[lumina-game-link] connecting to rpg db "${dbName}"`);
    const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 10000 });
    rpgDb = client.db(dbName);
    winston.info(`[lumina-game-link] connected to rpg db "${dbName}"`);
}

async function getGoogleSub(uid) {
    if (!uid) return null;
    const fields = await User.getUserFields(uid, ['googleid', 'gplusid']);
    return fields.googleid || fields.gplusid || null;
}

async function findPlayerByUid(uid) {
    if (!rpgDb) return null;
    const googleSub = await getGoogleSub(uid);
    if (!googleSub) return null;
    return rpgDb.collection('players').findOne(
        { googleSub },
        { projection: { username: 1, role: 1 } }
    );
}

async function findCharactersByUid(uid) {
    if (!rpgDb) return [];
    const player = await findPlayerByUid(uid);
    if (!player) return [];
    return rpgDb.collection('characters').find(
        { owner: player._id },
        { projection: { name: 1, level: 1, class: 1, race: 1, status: 1 } }
    ).toArray();
}

// True if requester is forum admin/mod OR game admin/gm.
async function isStaffViewer(req) {
    if (!req || !req.uid) return false;
    const isAdmin = await User.isAdministrator(req.uid);
    if (isAdmin) return true;
    const isGmod = await User.isGlobalModerator(req.uid);
    if (isGmod) return true;
    const player = await findPlayerByUid(req.uid);
    return !!(player && (player.role === 'admin' || player.role === 'gm'));
}

async function shouldRevealCharacters(targetUid, req) {
    if (await isStaffViewer(req)) return true;
    const settings = await User.getSettings(targetUid);
    return !settings || !settings[PREF_KEY];
}

Plugin.init = async function (params) {
    try {
        await connectToRpg();
    } catch (err) {
        winston.error(`[lumina-game-link] connect failed: ${err.message}`);
    }

    if (!params || !params.router) return params;
    const { router, middleware } = params;

    router.get('/api/lumina/role/:uid', async (req, res) => {
        try {
            const uid = parseInt(req.params.uid, 10);
            if (!uid) return res.json({ role: null });
            const player = await findPlayerByUid(uid);
            res.json({
                role: player ? player.role : null,
                username: player ? player.username : null,
            });
        } catch (err) {
            winston.error(`[lumina-game-link] /role failed: ${err.message}`);
            res.status(500).json({ error: 'internal' });
        }
    });

    router.get('/api/lumina/characters/:uid', async (req, res) => {
        try {
            const uid = parseInt(req.params.uid, 10);
            if (!uid) return res.json({ characters: [], reveal: false });

            const reveal = await shouldRevealCharacters(uid, req);
            if (!reveal) return res.json({ characters: [], reveal: false });

            const characters = await findCharactersByUid(uid);
            res.json({ characters, reveal: true });
        } catch (err) {
            winston.error(`[lumina-game-link] /characters failed: ${err.message}`);
            res.status(500).json({ error: 'internal' });
        }
    });

    router.get('/api/lumina/preference', async (req, res) => {
        try {
            if (!req.uid) return res.status(401).json({ error: 'login required' });
            const settings = await User.getSettings(req.uid);
            res.json({ hideCharacters: !!(settings && settings[PREF_KEY]) });
        } catch (err) {
            winston.error(`[lumina-game-link] GET /preference failed: ${err.message}`);
            res.status(500).json({ error: 'internal' });
        }
    });

    // POST is csrf-protected by NodeBB on /api/* routes; the client must send the token header.
    router.post('/api/lumina/preference', middleware ? middleware.applyCSRF : (r, _, n) => n(), async (req, res) => {
        try {
            if (!req.uid) return res.status(401).json({ error: 'login required' });
            const hide = !!(req.body && req.body.hideCharacters);
            await User.saveSettings(req.uid, { [PREF_KEY]: hide });
            res.json({ hideCharacters: hide });
        } catch (err) {
            winston.error(`[lumina-game-link] POST /preference failed: ${err.message}`);
            res.status(500).json({ error: 'internal' });
        }
    });

    winston.info('[lumina-game-link] routes registered: /api/lumina/{role,characters,preference}');
    return params;
};

Plugin.enrichUser = async function (data) {
    try {
        if (!data || !data.user || !data.user.uid) return data;
        const player = await findPlayerByUid(data.user.uid);
        if (player) {
            data.user.luminaGameRole = player.role;
            data.user.luminaGameUsername = player.username;
        }
    } catch (err) {
        winston.error(`[lumina-game-link] enrichUser failed: ${err.message}`);
    }
    return data;
};

module.exports = Plugin;
