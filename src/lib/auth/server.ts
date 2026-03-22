import { db } from "@/db";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [admin()],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "student",
        required: false,
        input: false,
      },
      status: {
        type: "string",
        defaultValue: "pending",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // New signups get status "pending" and are NOT banned
          // (banned blocks login via better-auth, status is our own approval flow)
          return { data: { ...user, status: "pending", role: "student", banned: false } };
        },
      },
    },
  },
});
