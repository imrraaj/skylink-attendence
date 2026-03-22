import { auth } from "@/lib/auth/server";
import { db } from "./index";
import { user } from "./schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@skylink.com";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_NAME = "Super Admin";

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if admin already exists
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log("✅ Admin already exists:", ADMIN_EMAIL);
    process.exit(0);
  }

  // Create admin via Better Auth API (ensures correct password hashing)
  await auth.api.signUpEmail({
    body: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });

  // Update the created user to be admin with active status
  await db
    .update(user)
    .set({ role: "admin", status: "active" })
    .where(eq(user.email, ADMIN_EMAIL));

  console.log("✅ Admin created successfully!");
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log("⚠️  Change the password after first login!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
