import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth/user";

export const registrationDocument = pgTable(
  "registration_document",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "academy_id" | "government_id"
    r2Key: text("r2Key").notNull(),
    originalFilename: text("originalFilename").notNull(),
    mimeType: text("mimeType").notNull(),
    uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.type)],
).enableRLS();

export type RegistrationDocumentType = typeof registrationDocument.$inferSelect;
