import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { options } from "@/db/schema/options";

async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [wifiRestrictionOption] = await db
      .select({ value: options.value })
      .from(options)
      .where(eq(options.key, "wifiRestrictionEnabled"))
      .limit(1);

    return NextResponse.json({
      wifiRestrictionEnabled: wifiRestrictionOption?.value !== "false",
      ddnsHost: process.env.ALLOWED_DDNS_HOST ?? null,
    });
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { wifiRestrictionEnabled?: boolean };
    if (typeof body.wifiRestrictionEnabled !== "boolean") {
      return NextResponse.json(
        { error: "wifiRestrictionEnabled must be a boolean" },
        { status: 400 },
      );
    }

    const value = body.wifiRestrictionEnabled ? "true" : "false";
    await db
      .insert(options)
      .values({ key: "wifiRestrictionEnabled", value })
      .onConflictDoUpdate({
        target: options.key,
        set: { value, updatedAt: new Date() },
      });

    return NextResponse.json({
      success: true,
      wifiRestrictionEnabled: body.wifiRestrictionEnabled,
    });
  } catch (error) {
    console.error("Admin settings PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
