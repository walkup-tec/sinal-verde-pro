#!/bin/sh
set -eu

PORT="${PORT:-3000}"
APP_DIR="/app"

# Garante .env.local para loadLocalEnvFile() do CRM
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
  echo "HOST=0.0.0.0"
  echo "NITRO_HOST=0.0.0.0"
} > "${APP_DIR}/.env.local"

if [ ! -f "${APP_DIR}/.output/server/index.mjs" ]; then
  echo "ERRO: build Nitro ausente (.output/server/index.mjs)." >&2
  exit 1
fi

cd "${APP_DIR}"
# Força bind em todas as interfaces — Easypanel às vezes injeta HOST=localhost (quebra Traefik → 502)
export PORT="${PORT}"
export NITRO_PORT="${PORT}"
export HOST=0.0.0.0
export NITRO_HOST=0.0.0.0
# Evita shutdown prematuro por SIGTERM de probe/redeploy durante o boot
export NITRO_SHUTDOWN_DISABLED=true

echo "Starting Nitro on 0.0.0.0:${PORT} (NITRO_HOST=${NITRO_HOST})"
exec node .output/server/index.mjs
