import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/get-session";
import StudentNav from "@/components/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role === "admin") redirect("/admin");
  if (session.user.status !== "active") redirect("/pending");

  const displayName = (session.user as { firstName?: string; lastName?: string }).firstName && (session.user as { firstName?: string; lastName?: string }).lastName
    ? `${(session.user as { firstName?: string }).firstName} ${(session.user as { lastName?: string }).lastName}`
    : session.user.name;

  return (
    <div className="min-h-screen bg-background">
      <StudentNav user={{ name: displayName, email: session.user.email }} />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
