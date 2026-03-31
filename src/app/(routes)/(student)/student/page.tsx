import { type Metadata } from "next";
import { getServerSession } from "@/lib/auth/get-session";
import AttendanceTimer from "@/components/attendance-timer";
import AttendanceSummary from "@/components/attendance-summary";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get first name for greeting
  const userWithNames = session!.user as { firstName?: string; name: string };
  const firstName = userWithNames.firstName || userWithNames.name.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <CalendarDays className="size-4" />
          <span>{today}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">Track your attendance for today</p>
      </div>

      {/* Check-in/out timer */}
      <AttendanceTimer />

      {/* Today's summary */}
      <AttendanceSummary userId={userId} />
    </div>
  );
}
