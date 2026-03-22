"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, FileCheck } from "lucide-react";
import Link from "next/link";

type ActiveStudent = {
  id: string;
  name: string;
  email: string;
  isCheckedIn: boolean;
  status: string;
};

type PendingRegistration = { id: string };

function formatElapsed(checkInAt: string): string {
  const ms = Date.now() - new Date(checkInAt).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminDashboardClient({ adminName }: { adminName: string }) {
  const [students, setStudents] = useState<(ActiveStudent & { checkInAt?: string })[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    async function load() {
      const [studRes, regRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/registrations"),
      ]);
      const { students: s } = await studRes.json();
      const { registrations: r } = await regRes.json();
      setStudents(s ?? []);
      setPendingCount((r ?? []).length);
      setLoading(false);
    }
    load();
  }, []);

  // Tick every minute to update elapsed times
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeStudents = students.filter((s) => s.isCheckedIn);
  const totalStudents = students.filter((s) => s.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {adminName.split(" ")[0]}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UserCheck}
          label="Checked In"
          value={loading ? "—" : String(activeStudents.length)}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={loading ? "—" : String(totalStudents.length)}
          color="blue"
        />
        <StatCard
          icon={FileCheck}
          label="Pending Approvals"
          value={loading ? "—" : String(pendingCount)}
          color={pendingCount > 0 ? "orange" : "blue"}
          href="/admin/registrations"
        />
        <StatCard
          icon={Clock}
          label="Today"
          value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          color="blue"
        />
      </div>

      {/* Active check-ins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Currently Checked In</CardTitle>
            <Badge variant="secondary">{activeStudents.length} active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : activeStudents.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <UserCheck className="size-8 mb-2 opacity-30" />
              <p className="text-sm">No students are currently checked in.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeStudents.map((s) => (
                <Link key={s.id} href={`/admin/students/${s.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                      Active
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending registrations alert */}
      {pendingCount > 0 && (
        <Link href="/admin/registrations">
          <Card className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <FileCheck className="size-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  {pendingCount} pending registration{pendingCount > 1 ? "s" : ""} awaiting approval
                </p>
                <p className="text-xs text-muted-foreground">Click to review and approve or deny</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "green" | "blue" | "orange";
  href?: string;
}) {
  const colors = {
    green: "bg-green-500/10 text-green-600",
    blue: "bg-primary/10 text-primary",
    orange: "bg-orange-500/10 text-orange-600",
  };

  const card = (
    <Card className={href ? "hover:bg-muted/30 transition-colors cursor-pointer" : ""}>
      <CardContent className="p-4">
        <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-3`}>
          <Icon className="size-4" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}
