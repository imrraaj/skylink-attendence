import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { user, attendanceSession } from "@/db/schema";
import { eq, and, isNull, ilike, or, inArray, notInArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

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
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get currently checked-in user IDs (needed for filter and status)
    const activeSessionRows = await db
      .select({ userId: attendanceSession.userId })
      .from(attendanceSession)
      .where(isNull(attendanceSession.checkOutAt));
    const activeSessionUserIds = new Set(activeSessionRows.map((s) => s.userId));
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
      // Search firstName, lastName, name (computed), and email
      conditions.push(
        or(
          ilike(user.firstName, term),
          ilike(user.lastName, term),
          ilike(user.name, term),
          ilike(user.email, term)
        )!
      );
    }

    if (filter === "checked-in" && activeUserIdArray.length > 0) {
      conditions.push(inArray(user.id, activeUserIdArray));
    } else if (filter === "checked-in" && activeUserIdArray.length === 0) {
      // No one is checked in — return empty
      return NextResponse.json({ students: [], page, limit });
    } else if (filter === "checked-out" && activeUserIdArray.length > 0) {
      conditions.push(notInArray(user.id, activeUserIdArray));
    }

    const whereClause = and(...conditions);

    const [students, [{ count: total }]] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          status: user.status,
          banned: user.banned,
        })
        .from(user)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(whereClause),
    ]);

    const studentsWithStatus = students.map((s) => ({
      ...s,
      isCheckedIn: activeSessionUserIds.has(s.id),
    }));

    return NextResponse.json({ students: studentsWithStatus, page, limit, total });
  } catch (error) {
    console.error("Students list error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
