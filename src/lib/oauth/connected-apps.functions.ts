import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";

export type ConnectedApp = {
  clientId: string;
  name: string;
  logoUrl: string | null;
  homepageUrl: string | null;
  scopes: string[];
  grantedAt: string;
};

/** Active "Login met ROUT" consents of the signed-in member. */
export const listConnectedApps = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ConnectedApp[]> => {
    const { sql } = await import("@/lib/neon");
    const rows = (await sql`select g.client_id, c.name, c.logo_url, c.homepage_url, g.scopes, g.created_at
      from public.oauth_consents g join public.oauth_clients c on c.client_id = g.client_id
      where g.user_id = ${context.userId} and g.revoked_at is null
      order by g.created_at desc limit 200`) as Record<string, unknown>[];
    return rows.map((r) => ({
      clientId: String(r["client_id"]),
      name: String(r["name"] ?? r["client_id"]),
      logoUrl: (r["logo_url"] as string | null) ?? null,
      homepageUrl: (r["homepage_url"] as string | null) ?? null,
      scopes: (r["scopes"] as string[] | null) ?? [],
      grantedAt: new Date(String(r["created_at"])).toISOString(),
    }));
  });

/** Revokes the consent and every access/refresh token of that app for this member, atomically. */
export const revokeConnectedApp = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d) => z.object({ clientId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { sql } = await import("@/lib/neon");
    await sql.transaction([
      sql`update public.oauth_consents set revoked_at = now()
        where user_id = ${context.userId} and client_id = ${data.clientId} and revoked_at is null`,
      sql`update public.oauth_refresh_tokens set revoked_at = coalesce(revoked_at, now())
        where user_id = ${context.userId} and client_id = ${data.clientId}`,
      sql`update public.oauth_access_tokens set revoked_at = coalesce(revoked_at, now())
        where user_id = ${context.userId} and client_id = ${data.clientId}`,
    ]);
    return { ok: true as const };
  });
