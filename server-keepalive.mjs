#!/usr/bin/env node
/**
 * Mantém o Nitro vivo no Swarm/Easypanel.
 * srvx fecha com "Server closed successfully" ao receber SIGTERM (healthcheck/redeploy).
 * Com CI=true o plugin de graceful shutdown do srvx não registra handlers;
 * aqui ignoramos SIGTERM para o processo não morrer no probe.
 */
process.env.CI = process.env.CI || "true";
process.env.HOST = process.env.HOST || "0.0.0.0";
process.env.NITRO_HOST = process.env.NITRO_HOST || "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";
process.env.NITRO_PORT = process.env.NITRO_PORT || process.env.PORT;

let acceptShutdown = false;
const bootMs = Number(process.env.SV_SIGTERM_GUARD_MS || 300000); // 5 min
setTimeout(() => {
  acceptShutdown = true;
  console.log(`[keepalive] SIGTERM guard released after ${bootMs}ms`);
}, bootMs);

for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    if (!acceptShutdown && sig === "SIGTERM") {
      console.log(`[keepalive] ignoring ${sig} (boot/healthcheck guard)`);
      return;
    }
    console.log(`[keepalive] ${sig} — exiting`);
    process.exit(0);
  });
}

console.log(`[keepalive] starting Nitro (CI=${process.env.CI} guard=${bootMs}ms)`);
await import("./.output/server/index.mjs");
