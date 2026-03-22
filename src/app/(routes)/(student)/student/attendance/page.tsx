import { type Metadata } from "next";
import { getServerSession } from "@/lib/auth/get-session";
import AttendanceSummary from "@/components/attendance-summary";

export const metadata: Metadata = { title: "My Attendance" };

export default async function StudentAttendancePage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">View your attendance history across different time periods</p>
      </div>
      <AttendanceSummary userId={userId} />
    </div>
  );
}
