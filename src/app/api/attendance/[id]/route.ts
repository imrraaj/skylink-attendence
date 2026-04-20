import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { attendanceSession } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { isValid, parseISO } from "date-fns";

function parseDateField(value: unknown, field: string): Date | null | Response {
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    return NextResponse.json({ error: `${field} must be a date string` }, { status: 400 });
  }

  const date = parseISO(value);
  if (!isValid(date)) {
    return NextResponse.json({ error: `${field} is invalid` }, { status: 400 });
  }

  return date;
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role === "admin";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json() as { checkInAt?: unknown; checkOutAt?: unknown };

    const [existing] = await db
      .select()
      .from(attendanceSession)
      .where(eq(attendanceSession.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Attendance entry not found" }, { status: 404 });
    }

    const values: { checkInAt?: Date; checkOutAt?: Date | null } = {};

    if ("checkInAt" in body) {
      const parsed = parseDateField(body.checkInAt, "Check in time");
      if (parsed instanceof Response) return parsed;
      if (!parsed) {
        return NextResponse.json({ error: "Check in time is required" }, { status: 400 });
      }
      values.checkInAt = parsed;
    }

    if ("checkOutAt" in body) {
      const parsed = parseDateField(body.checkOutAt, "Check out time");
      if (parsed instanceof Response) return parsed;
      values.checkOutAt = parsed;
    }

    if (Object.keys(values).length === 0) {
      return NextResponse.json({ error: "No attendance fields provided" }, { status: 400 });
    }

    const nextCheckInAt = values.checkInAt ?? existing.checkInAt;
    const nextCheckOutAt = "checkOutAt" in values ? values.checkOutAt ?? null : existing.checkOutAt;

    if (nextCheckOutAt && nextCheckOutAt.getTime() <= nextCheckInAt.getTime()) {
      return NextResponse.json({ error: "Check out time must be after check in time" }, { status: 400 });
    }

    const [updated] = await db
      .update(attendanceSession)
      .set(values)
      .where(eq(attendanceSession.id, id))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Attendance update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const [deleted] = await db
      .delete(attendanceSession)
      .where(eq(attendanceSession.id, id))
      .returning({ id: attendanceSession.id });

    if (!deleted) {
      return NextResponse.json({ error: "Attendance entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance delete error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
