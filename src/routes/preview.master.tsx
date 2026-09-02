import { createFileRoute, redirect } from "@tanstack/react-router";
import { firstAllowedAppPath } from "@/lib/auth/menu-access";
import { getAuthSessionFn, previewLoginMasterFn } from "@/lib/auth/auth.server";

/**
 * Preview local/cloud: abre já autenticado como Mozart master.
 * Só funciona sem DATABASE_URL (fallback JSON).
 */
export const Route = createFileRoute("/preview/master")({
  beforeLoad: async () => {
    const existing = await getAuthSessionFn();
    if (existing) {
      throw redirect({ to: firstAllowedAppPath(existing) });
    }

    const session = await previewLoginMasterFn();
    throw redirect({ to: firstAllowedAppPath(session) });
  },
});
