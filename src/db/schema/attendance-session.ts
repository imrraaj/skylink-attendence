import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth/user";

export const attendanceSession = pgTable(
  "attendance_session",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    checkInAt: timestamp("checkInAt").notNull(),
    checkOutAt: timestamp("checkOutAt"), // null = currently checked in
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("attendance_user_checkin_idx").on(t.userId, t.checkInAt)],
).enableRLS();

export type AttendanceSessionType = typeof attendanceSession.$inferSelect;
