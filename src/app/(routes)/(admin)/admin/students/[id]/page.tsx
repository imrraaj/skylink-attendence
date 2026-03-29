import { type Metadata } from "next";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import AttendanceSummary from "@/components/attendance-summary";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ResetPasswordButton from "./reset-password-button";
import PrintAttendanceDialog from "./print-attendance-dialog";
import BanStudentButton from "./ban-student-button";

export const metadata: Metadata = { title: "Student Detail" };

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [student] = await db
    .select()
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!student || student.role !== "student") notFound();

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/students">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
            Student Detail
            {student.banned && <Badge variant="destructive" className="ml-2">Banned</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Viewing attendance history</p>
        </div>
      </div>

      {/* Student info card */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 w-full">
            <h2 className="text-lg font-semibold truncate">{student.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3" />
              <span className="truncate">{student.email}</span>
            </div>
            {student.createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Calendar className="size-3" />
                <span>Joined {new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="w-full sm:w-auto grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
            <PrintAttendanceDialog
              userId={student.id}
              studentName={student.name}
              className="w-full sm:w-auto"
            />
            <ResetPasswordButton userId={student.id} className="w-full sm:w-auto" />
            <BanStudentButton
              userId={student.id}
              isBanned={student.banned ?? false}
              studentName={student.name}
              className="w-full sm:w-auto"
            />
            <Badge
              variant={student.status === "active" ? "secondary" : "destructive"}
              className="justify-center sm:justify-start"
            >
              {student.status === "active" ? "Active" : student.status === "pending" ? "Pending" : "Rejected"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Attendance summary — reused component */}
      <AttendanceSummary userId={student.id} />
    </div>
  );
}
