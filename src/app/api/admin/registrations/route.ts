import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { user, registrationDocument, account, session as sessionTable } from "@/db/schema";
import { deleteDocument } from "@/lib/r2-helpers";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all pending users with their documents
    const pendingUsers = await db
      .select()
      .from(user)
      .where(and(eq(user.status, "pending"), eq(user.role, "student")));

    // Get documents for each user
    const usersWithDocs = await Promise.all(
      pendingUsers.map(async (u) => {
        const docs = await db
          .select()
          .from(registrationDocument)
          .where(eq(registrationDocument.userId, u.id));
        return { ...u, documents: docs };
      }),
    );

    return NextResponse.json({ registrations: usersWithDocs });
  } catch (error) {
    console.error("Registrations GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, action } = await req.json() as { userId: string; action: "approve" | "deny" };

    if (action === "approve") {
      await db.update(user).set({ status: "active" }).where(eq(user.id, userId));
      return NextResponse.json({ success: true, message: "Account approved" });
    }

    if (action === "deny") {
      // Get and delete all R2 documents
      const docs = await db
        .select()
        .from(registrationDocument)
        .where(eq(registrationDocument.userId, userId));

      await Promise.all(docs.map((d) => deleteDocument(d.r2Key).catch(console.error)));

      // Delete related records first (no cascade on FK), then the user
      await db.delete(registrationDocument).where(eq(registrationDocument.userId, userId));
      await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
      await db.delete(account).where(eq(account.userId, userId));
      await db.delete(user).where(eq(user.id, userId));

      return NextResponse.json({ success: true, message: "Registration denied" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Registrations POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
