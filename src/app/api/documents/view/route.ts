import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { registrationDocument } from "@/db/schema";
import { getSignedDocumentUrl } from "@/lib/r2-helpers";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const docId = req.nextUrl.searchParams.get("id");
    if (!docId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    const [doc] = await db
      .select()
      .from(registrationDocument)
      .where(eq(registrationDocument.id, docId))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!doc.r2Key) {
      return NextResponse.json({ error: "Document file has been removed" }, { status: 404 });
    }

    const signedUrl = await getSignedDocumentUrl(doc.r2Key);
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Document view error:", error);
    return NextResponse.json({ error: "Failed to get document" }, { status: 500 });
  }
}
