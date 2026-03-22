import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { attendanceSession } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json() as { action: "check-in" | "check-out" };
    const userId = session.user.id;
    const now = new Date();

    if (action === "check-in") {
      // Check for existing open session
      const [open] = await db
        .select()
        .from(attendanceSession)
        .where(and(eq(attendanceSession.userId, userId), isNull(attendanceSession.checkOutAt)))
        .limit(1);

      if (open) {
        return NextResponse.json({ error: "Already checked in" }, { status: 400 });
      }

      const [created] = await db
        .insert(attendanceSession)
        .values({
          id: crypto.randomUUID(),
          userId,
          checkInAt: now,
          checkOutAt: null,
          createdAt: now,
        })
        .returning();

      return NextResponse.json({ session: created });
    }

    if (action === "check-out") {
      const [open] = await db
        .select()
        .from(attendanceSession)
        .where(and(eq(attendanceSession.userId, userId), isNull(attendanceSession.checkOutAt)))
        .limit(1);

      if (!open) {
        return NextResponse.json({ error: "No active check-in found" }, { status: 400 });
      }

      const [updated] = await db
        .update(attendanceSession)
        .set({ checkOutAt: now })
        .where(eq(attendanceSession.id, open.id))
        .returning();

      return NextResponse.json({ session: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET current open session for the logged-in user
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [open] = await db
      .select()
      .from(attendanceSession)
      .where(and(eq(attendanceSession.userId, session.user.id), isNull(attendanceSession.checkOutAt)))
      .limit(1);

    return NextResponse.json({ activeSession: open ?? null });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
