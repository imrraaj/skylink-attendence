import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { user, attendanceSession } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get all approved students
    const students = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        status: user.status,
      })
      .from(user)
      .where(eq(user.role, "student"))
      .limit(limit)
      .offset(offset);

    // Check which students are currently checked in
    const activeSessionUserIds = new Set(
      (await db
        .select({ userId: attendanceSession.userId })
        .from(attendanceSession)
        .where(isNull(attendanceSession.checkOutAt))
      ).map((s) => s.userId),
    );

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
