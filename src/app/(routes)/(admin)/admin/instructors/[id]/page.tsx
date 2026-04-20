import { type Metadata } from "next";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import AttendanceSummary from "@/components/attendance-summary";
import AttendanceTimer from "@/components/attendance-timer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ResetPasswordButton from "../../students/[id]/reset-password-button";
import PrintAttendanceDialog from "../../students/[id]/print-attendance-dialog";
import BanStudentButton from "../../students/[id]/ban-student-button";

export const metadata: Metadata = { title: "Instructor Detail" };

export default async function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [instructor] = await db
    .select()
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!instructor || instructor.role !== "instructor") notFound();

  const displayName = instructor.firstName && instructor.lastName 
    ? `${instructor.firstName} ${instructor.lastName}` 
    : instructor.name;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/instructors">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
            Instructor Detail
            {instructor.banned && <Badge variant="destructive" className="ml-2">Banned</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Viewing attendance history</p>
        </div>
      </div>

      {/* Instructor info card */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-blue-500/10 text-blue-600 font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{displayName}</h2>
              <Badge variant="outline" className="border-blue-500/50 text-blue-600">
                Instructor
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3" />
              <span className="truncate">{instructor.email}</span>
            </div>
            {instructor.createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Calendar className="size-3" />
                <span>Joined {new Date(instructor.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="w-full sm:w-auto grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
            <PrintAttendanceDialog
              userId={instructor.id}
              studentName={displayName}
              className="w-full sm:w-auto"
            />
            <ResetPasswordButton userId={instructor.id} className="w-full sm:w-auto" />
            <BanStudentButton
              userId={instructor.id}
              isBanned={instructor.banned ?? false}
              studentName={displayName}
              className="w-full sm:w-auto"
            />
            <Badge
              variant={instructor.status === "active" ? "secondary" : "destructive"}
              className="justify-center sm:justify-start"
            >
              {instructor.status === "active" ? "Active" : instructor.status === "pending" ? "Pending" : "Rejected"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <AttendanceTimer userId={instructor.id} subjectName={displayName} />

      {/* Attendance summary — reused component */}
      <AttendanceSummary userId={instructor.id} canManage />
    </div>
  );
}
