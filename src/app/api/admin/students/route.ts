import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { user, attendanceSession } from "@/db/schema";
import { eq, and, isNull, ilike, or, inArray, notInArray } from "drizzle-orm";
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
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get currently checked-in user IDs (needed for filter and status)
    const activeSessionRows = await db
      .select({ userId: attendanceSession.userId })
      .from(attendanceSession)
      .where(isNull(attendanceSession.checkOutAt));
    const activeSessionUserIds = new Set(activeSessionRows.map((s) => s.userId));
    const activeUserIdArray = [...activeSessionUserIds];

    // Build WHERE conditions
    const conditions = [eq(user.role, "student"), eq(user.status, "active")];

    if (search) {
      const term = `%${search}%`;
      conditions.push(or(ilike(user.name, term), ilike(user.email, term))!);
    }

    if (filter === "checked-in" && activeUserIdArray.length > 0) {
      conditions.push(inArray(user.id, activeUserIdArray));
    } else if (filter === "checked-in" && activeUserIdArray.length === 0) {
      // No one is checked in — return empty
      return NextResponse.json({ students: [], page, limit });
    } else if (filter === "checked-out" && activeUserIdArray.length > 0) {
      conditions.push(notInArray(user.id, activeUserIdArray));
    }

    const students = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        status: user.status,
      })
      .from(user)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    const studentsWithStatus = students.map((s) => ({
      ...s,
      isCheckedIn: activeSessionUserIds.has(s.id),
    }));

    return NextResponse.json({ students: studentsWithStatus, page, limit });
  } catch (error) {
    console.error("Students list error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
