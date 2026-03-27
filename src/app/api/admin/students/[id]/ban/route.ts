import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await req.json() as { action: "ban" | "unban" };

    const [targetUser] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "ban") {
      await auth.api.banUser({
        headers: await headers(),
        body: {
          userId: id,
          banReason: "Banned by admin",
        },
      });
      return NextResponse.json({ success: true, message: "User banned" });
    }

    if (action === "unban") {
      await auth.api.unbanUser({
        headers: await headers(),
        body: {
          userId: id,
        },
      });
      return NextResponse.json({ success: true, message: "User unbanned" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Ban/Unban error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
