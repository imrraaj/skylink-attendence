import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
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
      firstName: {
        type: "string",
        defaultValue: "",
        required: false,
        input: false,
      },
      lastName: {
        type: "string",
        defaultValue: "",
        required: false,
        input: false,
      },
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
        after: async (createdUser, ctx) => {
          // Extract custom headers for firstName, lastName, role
          const firstName = ctx?.request?.headers?.get("x-signup-firstname") ?? createdUser.name.split(" ")[0] ?? "";
          const lastName = ctx?.request?.headers?.get("x-signup-lastname") ?? createdUser.name.split(" ").slice(1).join(" ") ?? "";
          const signupRole = ctx?.request?.headers?.get("x-signup-role");
          const role = signupRole === "instructor" ? "instructor" : "student";

          // Update user with firstName, lastName, role
          await db
            .update(user)
            .set({
              firstName,
              lastName,
              role,
              status: "pending",
              banned: false,
            })
            .where(eq(user.id, createdUser.id));
        },
      },
    },
  },
});
