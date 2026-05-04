#!/usr/bin/env bash
echo "##### render-start.sh BEGIN #####"
echo "  date: $(date -u)"
echo "  pwd: $(pwd)"
echo "  user: $(whoami)"
echo "  PORT env: ${PORT:-(unset)}"
echo "  node: $(node -v)"

echo "  files in pwd:"
ls -la

echo "  config.json check:"
if [ -f config.json ]; then
  size=$(stat -c%s config.json 2>/dev/null || stat -f%z config.json 2>/dev/null)
  echo "    EXISTS, size $size bytes"
  echo "    content (password masked):"
  sed -E 's/("password"[[:space:]]*:[[:space:]]*)"[^"]*"/\1"REDACTED"/' config.json
else
  echo "    MISSING — runtime container lost build artifacts"
  echo "  Re-generating config.json from env vars..."
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
  "port": ${PORT:-10000},
  "silent": false
}
EOF
  mkdir -p logs
  echo "  config.json regenerated, size $(stat -c%s config.json) bytes"
fi

echo "  uploads dir check:"
UPLOADS=public/uploads
if [ -d "$UPLOADS" ]; then
  echo "    $UPLOADS EXISTS"
  echo "    mount info:"
  df -h "$UPLOADS" 2>&1 | sed 's/^/      /'
  echo "    permissions: $(ls -ld $UPLOADS)"
  echo "    file count: $(find $UPLOADS -type f 2>/dev/null | wc -l) files"
  echo "    sample contents (first 5):"
  ls -la "$UPLOADS" 2>&1 | head -10 | sed 's/^/      /'
else
  echo "    $UPLOADS MISSING — uploads will NOT persist"
  mkdir -p "$UPLOADS"
fi

echo "##### render-start.sh END — launching node app.js (single-process mode) #####"
# loader.js spawns workers with silent:true, hiding all real logs from Render.
# app.js is the actual NodeBB server — single process, logs straight to stdout.
exec node app.js
