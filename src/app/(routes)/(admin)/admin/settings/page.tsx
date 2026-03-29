import { type Metadata } from "next";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { options } from "@/db/schema/options";
import SettingsClient from "./settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [wifiRestrictionOption] = await db
    .select({ value: options.value })
    .from(options)
    .where(eq(options.key, "wifiRestrictionEnabled"))
    .limit(1);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure site-level access controls
        </p>
      </div>

      <SettingsClient
        initialWifiRestrictionEnabled={wifiRestrictionOption?.value !== "false"}
        ddnsHost={process.env.ALLOWED_DDNS_HOST ?? null}
      />
    </div>
  );
}
