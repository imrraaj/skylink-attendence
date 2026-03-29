import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { options } from "@/db/schema/options";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [wifiRestrictionOption] = await db
      .select({ value: options.value })
      .from(options)
      .where(eq(options.key, "wifiRestrictionEnabled"))
      .limit(1);

    return NextResponse.json({
      wifiRestrictionEnabled: wifiRestrictionOption?.value !== "false",
    });
  } catch (error) {
    console.error("Internal settings GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
