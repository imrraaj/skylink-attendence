import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Computed: firstName + " " + lastName (kept for better-auth compatibility)
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  role: text("role", { enum: ["student", "instructor", "admin"] }).default("student").notNull(),
  status: text("status", { enum: ["pending", "active", "rejected"] }).default("pending").notNull(),
  // Fields required by better-auth admin plugin — keep but don't use for approval flow
  banned: boolean("banned").default(false).notNull(),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export type UserType = typeof user.$inferSelect;
