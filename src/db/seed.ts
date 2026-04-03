import { auth } from "@/lib/auth/server";
import { db } from "./index";
import { user } from "./schema";
import { options } from "./schema/options";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";

const ADMIN_EMAIL = "admin@skylink.com";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_NAME = "Super Admin";

const NUM_STUDENTS = 40;
const NUM_INSTRUCTORS = 10;

async function createUser(firstName: string, lastName: string, email: string, role: "student" | "instructor") {
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing.length > 0) {
    return false;
  }

  await auth.api.signUpEmail({
    body: {
      name: `${firstName} ${lastName}`,
      email,
      password: "Test@123456",
    },
    headers: new Headers({
      "x-signup-firstname": firstName,
      "x-signup-lastname": lastName,
      "x-signup-role": role,
    }),
  });

  await db
    .update(user)
    .set({ status: "active", firstName, lastName, role })
    .where(eq(user.email, email));

  return true;
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Ensure default options always exist
  await db
    .insert(options)
    .values({ key: "wifiRestrictionEnabled", value: "true" })
    .onConflictDoNothing({ target: options.key });

  // Check if admin already exists
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log("✅ Admin already exists:", ADMIN_EMAIL);
  } else {
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
  }

  console.log("✅ Default settings ensured");

  // Seed students with faker
  // console.log(`\n🎓 Seeding ${NUM_STUDENTS} students...`);
  // let studentsCreated = 0;
  // for (let i = 0; i < NUM_STUDENTS; i++) {
  //   const firstName = faker.person.firstName();
  //   const lastName = faker.person.lastName();
  //   const email = faker.internet.email({ firstName, lastName, provider: "student.skylink.com" }).toLowerCase();
    
  //   const created = await createUser(firstName, lastName, email, "student");
  //   if (created) {
  //     studentsCreated++;
  //     console.log(`   ✅ ${studentsCreated}. ${firstName} ${lastName}`);
  //   }
  // }
  // console.log(`   Created ${studentsCreated} students`);

  // // Seed instructors with faker
  // console.log(`\n👨‍🏫 Seeding ${NUM_INSTRUCTORS} instructors...`);
  // let instructorsCreated = 0;
  // for (let i = 0; i < NUM_INSTRUCTORS; i++) {
  //   const firstName = faker.person.firstName();
  //   const lastName = faker.person.lastName();
  //   const email = faker.internet.email({ firstName, lastName, provider: "instructor.skylink.com" }).toLowerCase();
    
  //   const created = await createUser(firstName, lastName, email, "instructor");
  //   if (created) {
  //     instructorsCreated++;
  //     console.log(`   ✅ ${instructorsCreated}. ${firstName} ${lastName}`);
  //   }
  // }
  // console.log(`   Created ${instructorsCreated} instructors`);

  // console.log("\n🎉 Seeding complete!");
  // console.log("   Test password for all users: Test@123456");
  // process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
