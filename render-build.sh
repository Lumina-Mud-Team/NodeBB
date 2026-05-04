#!/usr/bin/env bash
set -e

# Debug: report which required env vars are present (values masked).
echo "===== render-build.sh: env var check ====="
for var in URL SECRET MONGO_HOST MONGO_PORT MONGO_USER MONGO_PASS MONGO_DB PORT; do
  val="${!var}"
  if [ -z "$val" ]; then
    echo "  $var = (MISSING)"
  else
    echo "  $var = (set, ${#val} chars)"
  fi
done
echo "=========================================="

# Copy NodeBB's package.json template into root so npm install works.
cp install/package.json package.json

# Install runtime dependencies only (skip dev tools, smaller install).
npm install --omit=dev

# Generate config.json from environment variables provided by Render.
# Required env vars (set them in Render dashboard → Environment):
#   URL, SECRET, MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PASS, MONGO_DB
# PORT is supplied automatically by Render (defaults to 10000 if missing).
cat > config.json <<EOF
{
  "url": "${URL}",
  "secret": "${SECRET}",
  "database": "mongo",
  "mongo": {
    "host": "${MONGO_HOST}",
    "port": "${MONGO_PORT}",
    "username": "${MONGO_USER}",
    "password": "${MONGO_PASS}",
    "database": "${MONGO_DB}"
  },
  "port": ${PORT:-10000}
}
EOF

# Debug: validate generated config.json (mask password).
echo "===== generated config.json (password masked) ====="
sed -E 's/("password"[[:space:]]*:[[:space:]]*)"[^"]*"/\1"REDACTED"/' config.json
echo "==================================================="
echo "config.json absolute path:"
ls -la "$(pwd)/config.json"
echo "JSON syntax check:"
node -e "JSON.parse(require('fs').readFileSync('config.json','utf8')); console.log('  ✓ valid JSON');"

# Test Mongo connection directly with the mongodb driver (proves Atlas reachable).
echo "===== MongoDB connectivity test ====="
node -e "
const cfg = JSON.parse(require('fs').readFileSync('config.json','utf8')).mongo;
const hosts = cfg.host.split(',').map((h,i) => h + ':' + cfg.port.split(',')[i]).join(',');
const uri = 'mongodb://' + encodeURIComponent(cfg.username) + ':' + encodeURIComponent(cfg.password) + '@' + hosts + '/' + cfg.database;
console.log('  URI (masked):', uri.replace(cfg.password, '***'));
const { MongoClient } = require('mongodb');
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
client.connect()
  .then(() => client.db().command({ ping: 1 }))
  .then(r => { console.log('  ✓ Mongo ping OK:', JSON.stringify(r)); return client.close(); })
  .catch(err => { console.error('  ✗ Mongo connect FAILED:', err.message); process.exit(2); });
"
echo "====================================="

# Build NodeBB assets (templates, JS bundles, CSS).
./nodebb build
