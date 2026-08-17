#!/usr/bin/env node
/**
 * Ping no Postgres do Supabase (insert + delete) para registrar atividade no banco.
 * Plano Free pausa projetos após ~7 dias sem queries — ver:
 * https://supabase.com/docs/guides/platform/free-project-pausing
 *
 * Uso local:  DATABASE_URL=... node scripts/supabase-keepalive.mjs
 * CI:         secret DATABASE_URL no workflow supabase-keepalive.yml
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i < 0) continue;
      if (trimmed.slice(0, i) === "DATABASE_URL") {
        return trimmed.slice(i + 1).trim();
      }
    }
  } catch {
    // ignore
  }
  return null;
}

const url = loadDatabaseUrl();
if (!url) {
  console.error("[supabase-keepalive] DATABASE_URL ausente");
  process.exit(1);
}

const host = url.replace(/:[^:@]+@/, ":****@").replace(/^postgres(ql)?:\/\//, "").split("/")[0];
console.log(`[supabase-keepalive] host=${host}`);

const sql = postgres(url, {
  ssl: "require",
  prepare: false,
  max: 1,
  connect_timeout: 20,
  idle_timeout: 5,
});

const t0 = Date.now();

try {
  await sql`
    create table if not exists crm.supabase_keepalive (
      id bigserial primary key,
      pinged_at timestamptz not null default now()
    )
  `;

  const [row] = await sql`
    insert into crm.supabase_keepalive default values
    returning id, pinged_at
  `;

  await sql`delete from crm.supabase_keepalive where id = ${row.id}`;

  console.log(
    `[supabase-keepalive] OK id=${row.id} pinged_at=${row.pinged_at.toISOString()} ms=${Date.now() - t0}`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[supabase-keepalive] FAIL ${message}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
