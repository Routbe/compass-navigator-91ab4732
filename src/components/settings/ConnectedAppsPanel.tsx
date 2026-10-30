import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppWindow, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listConnectedApps, revokeConnectedApp } from "@/lib/oauth/connected-apps.functions";

/** Apps the member granted access via "Login met ROUT", with per-app revoke. */
export function ConnectedAppsPanel() {
  const list = useServerFn(listConnectedApps);
  const revoke = useServerFn(revokeConnectedApp);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["connected-apps"], queryFn: () => list() });

  async function onRevoke(clientId: string, name: string) {
    setBusy(clientId);
    try {
      await revoke({ data: { clientId } });
      toast.success(`Toegang voor ${name} is ingetrokken.`);
      await qc.invalidateQueries({ queryKey: ["connected-apps"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Intrekken mislukt.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <AppWindow className="h-4 w-4" /> Verbonden apps
      </h2>
      <p className="text-sm text-muted-foreground">Apps waarbij je inlogde met ROUT. Intrekken logt de app direct uit.</p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">Nog geen verbonden apps.</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((app) => (
            <li key={app.clientId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{app.name}</p>
                <p className="text-xs text-muted-foreground">
                  Sinds {new Date(app.grantedAt).toLocaleDateString("nl-BE")}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {app.scopes.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs font-normal">{s}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" disabled={busy === app.clientId}
                onClick={() => void onRevoke(app.clientId, app.name)}>
                {busy === app.clientId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Toegang intrekken"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
