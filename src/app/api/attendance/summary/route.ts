import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { attendanceSession } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";
import { getAttendancePeriodRange, isAttendancePeriod } from "@/lib/attendance-period";
import { differenceInMinutes } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = req.nextUrl;
    const periodParam = url.searchParams.get("period") ?? "week";
    const period = periodParam === "custom" || isAttendancePeriod(periodParam) ? periodParam : "week";
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");
    const requestedUserId = url.searchParams.get("userId");

    // Students can only view their own data; admins can view any user
    const isAdmin = session.user.role === "admin";
    const userId = isAdmin && requestedUserId ? requestedUserId : session.user.id;

    if (!isAdmin && requestedUserId && requestedUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { start, end } = getAttendancePeriodRange(period, offset, fromStr, toStr);

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
        totalMinutes += differenceInMinutes(s.checkOutAt, s.checkInAt);
      }
    }

    return NextResponse.json({ sessions, totalMinutes });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
