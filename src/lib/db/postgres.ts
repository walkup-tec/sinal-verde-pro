import postgres from "postgres";
import { loadLocalEnvFile } from "@/lib/db/load-env-file";
import { ensureClientListIndexes } from "@/lib/db/ensure-client-indexes";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

loadLocalEnvFile();

export type Sql = postgres.Sql;

const DB_OP_TIMEOUT_MS = 12_000;
const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000;
const MAX_CONSECUTIVE_HEARTBEAT_FAILURES = 3;

let sqlInstance: Sql | null = null;
let ready: Promise<void> | null = null;
let consecutiveHeartbeatFailures = 0;
let heartbeatStarted = false;

export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function withDbTimeout<T>(promise: Promise<T>, ms = DB_OP_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operação no banco excedeu ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function resetSqlPool(): Promise<void> {
  const instance = sqlInstance;
  sqlInstance = null;
  ready = null;
  if (!instance) return;
  try {
    await instance.end({ timeout: 5 });
  } catch (error) {
    console.error("[db] pool end failed", error);
  }
}

async function probeDatabaseDirect(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return;

  const probe = postgres(url, {
    ssl: "require",
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    await withDbTimeout(probe`select 1 as ok`, 10_000);
  } finally {
    try {
      await probe.end({ timeout: 3 });
    } catch {
      // ignore
    }
  }
}

async function runDatabaseHeartbeat(): Promise<void> {
  if (!isDatabaseEnabled()) return;

  try {
    // Conexão isolada — detecta Supabase ok mesmo com pool principal preso.
    await probeDatabaseDirect();

    const sql = await withDbTimeout(getSql(), 10_000);
    await withDbTimeout(sql`select 1 as ok`, 10_000);

    consecutiveHeartbeatFailures = 0;
  } catch (error) {
    consecutiveHeartbeatFailures += 1;
    console.error(
      `[db] heartbeat failed (${consecutiveHeartbeatFailures}/${MAX_CONSECUTIVE_HEARTBEAT_FAILURES})`,
      error,
    );
    await resetSqlPool();

    if (consecutiveHeartbeatFailures >= MAX_CONSECUTIVE_HEARTBEAT_FAILURES) {
      console.error("[db] heartbeat exhausted — exiting for container restart");
      process.exit(1);
    }
  }
}

export function startDatabaseHeartbeat(): void {
  if (!isDatabaseEnabled() || heartbeatStarted) return;
  heartbeatStarted = true;

  void runDatabaseHeartbeat();
  setInterval(() => {
    void runDatabaseHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
}

export async function getSql(): Promise<Sql> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL não configurada. Defina em .env.local.");
  }

  if (!sqlInstance) {
    sqlInstance = postgres(url, {
      ssl: "require",
      prepare: false,
      max: 10,
      connect_timeout: 15,
      idle_timeout: 20,
      max_lifetime: 60 * 15,
    });
  }

  if (!ready) {
    ready = ensureDatabaseSeeded(sqlInstance)
      .then(() => ensureClientListIndexes(sqlInstance!))
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  await ready;

  return sqlInstance;
}

/** Aquece pool + seed/indexes em background (não bloqueia o boot). */
export function warmDatabaseConnection(): void {
  if (!isDatabaseEnabled()) return;
  void getSql().catch((error) => {
    console.error("[db] warm connection failed", error);
  });
}
