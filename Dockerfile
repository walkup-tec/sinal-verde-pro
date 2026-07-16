# Sinal Verde CRM — build Cloudflare (TanStack Start) servido localmente via Wrangler/Miniflare
# Porta interna: 3000 (Easypanel)

FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1.3-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/wrangler.jsonc ./wrangler.jsonc
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh \
  && addgroup -S app && adduser -S app -G app \
  && mkdir -p /tmp/wrangler-state \
  && chown -R app:app /app /tmp/wrangler-state

USER app
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
