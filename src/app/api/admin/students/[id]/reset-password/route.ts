import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { account } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { hashPassword } from "better-auth/crypto";

const DEFAULT_PASSWORD = "Skylink@123";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = await params;

    // Find the user's credential account
    const [userAccount] = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId))
      .limit(1);

    if (!userAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Hash the default password and update
    const hashed = await hashPassword(DEFAULT_PASSWORD);
    await db
      .update(account)
      .set({ password: hashed })
      .where(eq(account.id, userAccount.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
