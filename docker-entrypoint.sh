#!/bin/sh
set -eu

PORT="${PORT:-3000}"
APP_DIR="/app"

write_env_file() {
  dest="$1"
  {
    echo "SESSION_SECRET=${SESSION_SECRET:-}"
    echo "DATABASE_URL=${DATABASE_URL:-}"
    echo "SUPABASE_URL=${SUPABASE_URL:-}"
    echo "SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY:-}"
    echo "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-}"
    echo "APP_URL=${APP_URL:-}"
    echo "PUBLIC_APP_URL=${PUBLIC_APP_URL:-${APP_URL:-}}"
    echo "MAIL_MODE=${MAIL_MODE:-}"
    echo "MAIL_FROM=${MAIL_FROM:-}"
    echo "SMTP_HOST=${SMTP_HOST:-}"
    echo "SMTP_PORT=${SMTP_PORT:-}"
    echo "SMTP_SECURE=${SMTP_SECURE:-}"
    echo "SMTP_USER=${SMTP_USER:-}"
    echo "SMTP_PASS=${SMTP_PASS:-}"
    echo "NODE_ENV=${NODE_ENV:-production}"
    echo "PORT=${PORT}"
  } > "$dest"
}

write_env_file "${APP_DIR}/.dev.vars"
write_env_file "${APP_DIR}/.env.local"
write_env_file "${APP_DIR}/dist/server/.dev.vars"

if [ ! -f "${APP_DIR}/dist/server/index.js" ]; then
  echo "ERRO: build ausente (dist/server/index.js). Verifique o Docker build." >&2
  exit 1
fi

cd "${APP_DIR}"
exec bunx wrangler dev \
  --local \
  --ip 0.0.0.0 \
  --port "${PORT}" \
  --config "${APP_DIR}/dist/server/wrangler.json" \
  --persist-to /tmp/wrangler-state
