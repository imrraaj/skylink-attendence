import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { attendanceSession } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";

function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = req.nextUrl;
    const period = url.searchParams.get("period") ?? "today";
    const requestedUserId = url.searchParams.get("userId");

    // Students can only view their own data; admins can view any user
    const isAdmin = session.user.role === "admin";
    const userId = isAdmin && requestedUserId ? requestedUserId : session.user.id;

    if (!isAdmin && requestedUserId && requestedUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { start, end } = getPeriodRange(period);

    const sessions = await db
      .select()
      .from(attendanceSession)
      .where(
        and(
          eq(attendanceSession.userId, userId),
          gte(attendanceSession.checkInAt, start),
          lte(attendanceSession.checkInAt, end),
        ),
      )
      .orderBy(attendanceSession.checkInAt);

    // Compute total duration (only completed sessions)
    let totalMinutes = 0;
    for (const s of sessions) {
      if (s.checkOutAt) {
        const diff = s.checkOutAt.getTime() - s.checkInAt.getTime();
        totalMinutes += Math.floor(diff / 60000);
      }
    }

    return NextResponse.json({ sessions, totalMinutes });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
