import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "./r2";

export async function uploadDocument(
  fileBuffer: Buffer,
  userId: string,
  docType: string,
  filename: string,
  mimeType: string,
): Promise<string> {
  const ext = filename.split(".").pop() ?? "bin";
  const r2Key = `documents/${userId}/${docType}_${Date.now()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: mimeType,
    }),
  );

  return r2Key;
}

export async function getSignedDocumentUrl(r2Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
  });

  return getSignedUrl(r2, command, { expiresIn: 300 }); // 5 minutes
}

export async function deleteDocument(r2Key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
    }),
  );
}
