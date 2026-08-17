import type { Sql } from "@/lib/db/postgres";

/** Tabela leve para ping periódico (evita pausa do Supabase Free por inatividade). */
export async function ensureSupabaseKeepaliveTable(sql: Sql): Promise<void> {
  await sql`
    create table if not exists crm.supabase_keepalive (
      id bigserial primary key,
      pinged_at timestamptz not null default now()
    )
  `;
}
