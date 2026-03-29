import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const options = pgTable("options", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OptionsType = typeof options.$inferSelect;
