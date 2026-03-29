"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Wifi } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  initialWifiRestrictionEnabled: boolean;
  ddnsHost: string | null;
};

export default function SettingsClient({
  initialWifiRestrictionEnabled,
  ddnsHost,
}: Props) {
  const [enabled, setEnabled] = useState(initialWifiRestrictionEnabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const next = !enabled;

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wifiRestrictionEnabled: next }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update settings");
        return;
      }

      setEnabled(next);
      toast.success(`WiFi restriction ${next ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="size-4" />
          WiFi Network Restriction
        </CardTitle>
        <CardDescription>
          Restrict site access to users on the configured academy network.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Configured DDNS host</p>
          {ddnsHost ? (
            <pre className="rounded-md border bg-muted px-3 py-2 text-xs overflow-auto">
              {ddnsHost}
            </pre>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              DDNS host is not configured. Restriction is skipped until ALLOWED_DDNS_HOST is set.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={enabled ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-600"}
          >
            {enabled ? "Enabled" : "Disabled"}
          </Badge>

          <Button onClick={handleToggle} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : enabled ? (
              "Disable Restriction"
            ) : (
              "Enable Restriction"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
