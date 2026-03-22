import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { attendanceSession } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";

function getPeriodRange(period: string, offset: number): { start: Date; end: Date } {
  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setDate(start.getDate() + offset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "week") {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - day + offset * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear() + offset, 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // fallback: today
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
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
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const requestedUserId = url.searchParams.get("userId");

    // Students can only view their own data; admins can view any user
    const isAdmin = session.user.role === "admin";
    const userId = isAdmin && requestedUserId ? requestedUserId : session.user.id;

    if (!isAdmin && requestedUserId && requestedUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { start, end } = getPeriodRange(period, offset);

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
