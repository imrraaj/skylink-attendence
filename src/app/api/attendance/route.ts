import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { attendanceSession, user } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";

async function ensureTargetUserExists(userId: string) {
  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return Boolean(target);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, userId: requestedUserId } = await req.json() as {
      action: "check-in" | "check-out";
      userId?: string;
    };
    const isAdmin = session.user.role === "admin";
    const userId = isAdmin && requestedUserId ? requestedUserId : session.user.id;
    const now = new Date();

    if (!isAdmin && requestedUserId && requestedUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (requestedUserId && !(await ensureTargetUserExists(userId))) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

// GET current open session for the logged-in user, or an admin-selected user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedUserId = req.nextUrl.searchParams.get("userId");
    const isAdmin = session.user.role === "admin";
    const userId = isAdmin && requestedUserId ? requestedUserId : session.user.id;

    if (!isAdmin && requestedUserId && requestedUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (requestedUserId && !(await ensureTargetUserExists(userId))) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [open] = await db
      .select()
      .from(attendanceSession)
      .where(and(eq(attendanceSession.userId, userId), isNull(attendanceSession.checkOutAt)))
      .limit(1);

    return NextResponse.json({ activeSession: open ?? null });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
