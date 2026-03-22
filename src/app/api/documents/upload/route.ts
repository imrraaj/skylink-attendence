import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { registrationDocument } from "@/db/schema";
import { uploadDocument } from "@/lib/r2-helpers";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const academyIdFile = formData.get("academy_id") as File | null;
    const governmentIdFile = formData.get("government_id") as File | null;

    if (!academyIdFile || !governmentIdFile) {
      return NextResponse.json(
        { error: "Both academy ID and government ID are required" },
        { status: 400 },
      );
    }

    // Validate files
    for (const [type, file] of [
      ["academy_id", academyIdFile],
      ["government_id", governmentIdFile],
    ] as const) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `${type}: only JPEG, PNG, or PDF files allowed` },
          { status: 400 },
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `${type}: file must be under 5MB` },
          { status: 400 },
        );
      }
    }

    // Upload files to R2 sequentially to avoid stream issues
    const academyBuffer = Buffer.from(await academyIdFile.arrayBuffer());
    const academyKey = await uploadDocument(
      academyBuffer, userId, "academy_id", academyIdFile.name, academyIdFile.type,
    );

    const governmentBuffer = Buffer.from(await governmentIdFile.arrayBuffer());
    const governmentKey = await uploadDocument(
      governmentBuffer, userId, "government_id", governmentIdFile.name, governmentIdFile.type,
    );

    // Save document records in DB (upsert to handle retries)
    for (const doc of [
      { type: "academy_id" as const, r2Key: academyKey, file: academyIdFile },
      { type: "government_id" as const, r2Key: governmentKey, file: governmentIdFile },
    ]) {
      await db
        .insert(registrationDocument)
        .values({
          id: crypto.randomUUID(),
          userId,
          type: doc.type,
          r2Key: doc.r2Key,
          originalFilename: doc.file.name,
          mimeType: doc.file.type,
        })
        .onConflictDoUpdate({
          target: [registrationDocument.userId, registrationDocument.type],
          set: {
            r2Key: doc.r2Key,
            originalFilename: doc.file.name,
            mimeType: doc.file.type,
            uploadedAt: new Date(),
          },
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
