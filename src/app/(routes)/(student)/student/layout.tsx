import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/get-session";
import StudentNav from "@/components/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role === "admin") redirect("/admin");
  if (session.user.status !== "active") redirect("/pending");

  return (
    <div className="min-h-screen bg-background">
      <StudentNav user={{ name: session.user.name, email: session.user.email }} />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
