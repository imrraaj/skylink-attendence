import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/get-session";
import AdminNav from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "admin") redirect("/student");

  const displayName = (session.user as { firstName?: string; lastName?: string }).firstName && (session.user as { firstName?: string; lastName?: string }).lastName
    ? `${(session.user as { firstName?: string }).firstName} ${(session.user as { lastName?: string }).lastName}`
    : session.user.name;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav user={{ name: displayName, email: session.user.email }} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
