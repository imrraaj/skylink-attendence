import { type Metadata } from "next";
import { getServerSession } from "@/lib/auth/get-session";
import AdminDashboardClient from "./dashboard-client";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  return <AdminDashboardClient adminName={session!.user.name} />;
}
