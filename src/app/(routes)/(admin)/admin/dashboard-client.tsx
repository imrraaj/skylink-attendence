"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, FileCheck } from "lucide-react";
import Link from "next/link";
import { formatDisplayShortDate, formatDisplayTime } from "@/lib/display-timezone";

type ActiveStudent = {
  id: string;
  name: string;
  isCheckedIn: boolean;
  status: string;
  activeCheckInAt: string | null;
};

type PendingRegistration = { id: string };

function formatTime(iso: string | null): string {
  if (!iso) return "No time";
  return formatDisplayTime(iso);
}

export default function AdminDashboardClient({ adminName }: { adminName: string }) {
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [studRes, activeRes, regRes] = await Promise.all([
        fetch("/api/admin/students?role=student"),
        fetch("/api/admin/students?role=student&filter=checked-in"),
        fetch("/api/admin/registrations"),
      ]);
      const { total } = await studRes.json();
      const { students: active } = await activeRes.json();
      const { registrations: r } = await regRes.json();
      setStudents(active ?? []);
      setTotalStudents(total ?? 0);
      setPendingCount((r ?? []).length);
      setLoading(false);
    }
    load();
  }, []);

  const activeStudents = students;

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
          value={loading ? "—" : String(totalStudents)}
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
          value={formatDisplayShortDate(new Date())}
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
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
                  <div className="flex items-center justify-between p-3 m-1 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">check in time</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                      {formatTime(s.activeCheckInAt)}
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
