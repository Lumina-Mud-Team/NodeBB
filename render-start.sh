#!/usr/bin/env bash
echo "===== render-start.sh =====" >&2
echo "  date: $(date -u)" >&2
echo "  pwd: $(pwd)" >&2
echo "  user: $(whoami)" >&2
echo "  PORT env: ${PORT:-(unset)}" >&2
echo "  files in pwd:" >&2
ls -la 2>&1 | sed 's/^/    /' >&2
echo "  config.json check:" >&2
if [ -f config.json ]; then
  echo "    config.json EXISTS, size $(stat -c%s config.json) bytes" >&2
  echo "    content (password masked):" >&2
  sed -E 's/("password"[[:space:]]*:[[:space:]]*)"[^"]*"/\1"REDACTED"/' config.json | sed 's/^/      /' >&2
else
  echo "    config.json MISSING — runtime container likely lost build artifacts" >&2
fi
echo "  node version: $(node -v)" >&2
echo "===========================" >&2

# Hand off to NodeBB. Use exec so signals (SIGTERM from Render) propagate cleanly.
exec node loader.js
