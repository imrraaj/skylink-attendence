import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/get-session";
import AdminNav from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "admin") redirect("/student");

  return (
    <div className="min-h-screen bg-background">
      <AdminNav user={{ name: session.user.name, email: session.user.email }} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
