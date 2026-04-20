import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { user, attendanceSession } from "@/db/schema";
import { eq, and, isNull, ilike, or, inArray, notInArray, sql, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";
import { getAttendancePeriodRange, isAttendancePeriod } from "@/lib/attendance-period";
import { differenceInMinutes } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const search = url.searchParams.get("search")?.trim() ?? "";
    const filter = url.searchParams.get("filter") ?? "";
    const roleFilter = url.searchParams.get("role") ?? ""; // "student" | "instructor" | ""
    const periodParam = url.searchParams.get("period") ?? "week";
    const attendancePeriod = isAttendancePeriod(periodParam) ? periodParam : "week";
    const parsedAttendanceOffset = Number.parseInt(url.searchParams.get("attendanceOffset") ?? "0", 10);
    const attendanceOffset = Number.isFinite(parsedAttendanceOffset) ? parsedAttendanceOffset : 0;
    const { start, end } = getAttendancePeriodRange(attendancePeriod, attendanceOffset);
    const limit = 20;
    const pageOffset = (page - 1) * limit;

    // Get currently checked-in user IDs (needed for filter and status)
    const activeSessionRows = await db
      .select({ userId: attendanceSession.userId, checkInAt: attendanceSession.checkInAt })
      .from(attendanceSession)
      .where(isNull(attendanceSession.checkOutAt));
    const activeSessionUserIds = new Set(activeSessionRows.map((s) => s.userId));
    const activeCheckInByUserId = new Map(activeSessionRows.map((s) => [s.userId, s.checkInAt]));
    const activeUserIdArray = [...activeSessionUserIds];

    // Build WHERE conditions - include both students and instructors unless filtered
    const conditions = [];
    
    if (roleFilter === "student") {
      conditions.push(eq(user.role, "student"));
    } else if (roleFilter === "instructor") {
      conditions.push(eq(user.role, "instructor"));
    } else {
      // Show both students and instructors (not admins)
      conditions.push(or(eq(user.role, "student"), eq(user.role, "instructor"))!);
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(user.firstName, term),
          ilike(user.lastName, term),
          ilike(user.name, term)
        )!
      );
    }

    if (filter === "checked-in" && activeUserIdArray.length > 0) {
      conditions.push(inArray(user.id, activeUserIdArray));
    } else if (filter === "checked-in" && activeUserIdArray.length === 0) {
      // No one is checked in — return empty
      return NextResponse.json({ students: [], page, limit, total: 0 });
    } else if (filter === "checked-out" && activeUserIdArray.length > 0) {
      conditions.push(notInArray(user.id, activeUserIdArray));
    }

    const whereClause = and(...conditions);

    const [allStudents, [{ count: total }]] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          status: user.status,
          banned: user.banned,
        })
        .from(user)
        .where(whereClause),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(whereClause),
    ]);

    const attendanceByUserId = new Map<string, {
      totalMinutes: number;
      firstCheckInAt: Date | null;
      latestCheckOutAt: Date | null;
    }>();
    const studentIds = allStudents.map((s) => s.id);

    if (studentIds.length > 0) {
      const attendanceRows = await db
        .select({
          userId: attendanceSession.userId,
          checkInAt: attendanceSession.checkInAt,
          checkOutAt: attendanceSession.checkOutAt,
        })
        .from(attendanceSession)
        .where(
          and(
            inArray(attendanceSession.userId, studentIds),
            gte(attendanceSession.checkInAt, start),
            lte(attendanceSession.checkInAt, end),
          ),
        )
        .orderBy(attendanceSession.checkInAt);

      for (const row of attendanceRows) {
        const current = attendanceByUserId.get(row.userId) ?? {
          totalMinutes: 0,
          firstCheckInAt: null,
          latestCheckOutAt: null,
        };
        if (!current.firstCheckInAt || row.checkInAt.getTime() < current.firstCheckInAt.getTime()) {
          current.firstCheckInAt = row.checkInAt;
        }
        if (row.checkOutAt) {
          current.totalMinutes += differenceInMinutes(row.checkOutAt, row.checkInAt);
          if (!current.latestCheckOutAt || row.checkOutAt.getTime() > current.latestCheckOutAt.getTime()) {
            current.latestCheckOutAt = row.checkOutAt;
          }
        }
        attendanceByUserId.set(row.userId, current);
      }
    }

    const studentsWithStatus = allStudents
      .map((s) => ({
        ...s,
        isCheckedIn: activeSessionUserIds.has(s.id),
        activeCheckInAt: activeCheckInByUserId.get(s.id) ?? null,
        totalMinutes: attendanceByUserId.get(s.id)?.totalMinutes ?? 0,
        firstCheckInAt: attendanceByUserId.get(s.id)?.firstCheckInAt ?? null,
        latestCheckOutAt: attendanceByUserId.get(s.id)?.latestCheckOutAt ?? null,
      }))
      .sort((a, b) => {
        if (filter === "checked-in") {
          const aTime = a.activeCheckInAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const bTime = b.activeCheckInAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return aTime - bTime || a.name.localeCompare(b.name);
        }

        if (filter === "checked-out") {
          const aTime = a.latestCheckOutAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const bTime = b.latestCheckOutAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return aTime - bTime || a.name.localeCompare(b.name);
        }

        return a.name.localeCompare(b.name);
      })
      .slice(pageOffset, pageOffset + limit);

    return NextResponse.json({ students: studentsWithStatus, page, limit, total });
  } catch (error) {
    console.error("Students list error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
