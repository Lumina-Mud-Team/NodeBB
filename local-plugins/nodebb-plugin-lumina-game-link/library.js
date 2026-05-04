'use strict';

// Bridge tra vhrazul-server (collection rpg_fantasy.players) e NodeBB.
// Espone:
//   - GET /api/lumina/role/:uid → { role, username } per il badge client-side
//   - filter:user.summary hook → arricchisce data.user con luminaGameRole/Username (per template che li volessero usare)
//
// Lookup: NodeBB uid → googleSub (via plugin sso-google) → Player document per googleSub.

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const { MongoClient } = require.main.require('mongodb');
const User = require.main.require('./src/user');

const Plugin = {};
let rpgDb = null;

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

// Recupera googleSub salvato dal plugin nodebb-plugin-sso-google sull'utente NodeBB.
// Il field name è cambiato negli anni: prova entrambi.
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

Plugin.init = async function (params) {
    try {
        await connectToRpg();
    } catch (err) {
        winston.error(`[lumina-game-link] connect failed: ${err.message}`);
    }

    if (params && params.router) {
        params.router.get('/api/lumina/role/:uid', async (req, res) => {
            try {
                const uid = parseInt(req.params.uid, 10);
                if (!uid) return res.json({ role: null });
                const player = await findPlayerByUid(uid);
                res.json({
                    role: player ? player.role : null,
                    username: player ? player.username : null,
                });
            } catch (err) {
                winston.error(`[lumina-game-link] /api/lumina/role/:uid failed: ${err.message}`);
                res.status(500).json({ error: 'internal' });
            }
        });
        winston.info('[lumina-game-link] route registered: GET /api/lumina/role/:uid');
    }

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
