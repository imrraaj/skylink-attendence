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
        <div>
          <h1 className="text-2xl font-bold">Student Detail</h1>
          <p className="text-sm text-muted-foreground">Viewing attendance history</p>
        </div>
      </div>

      {/* Student info card */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
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
          <Badge variant={student.status === "active" ? "secondary" : "destructive"} className="shrink-0">
            {student.status === "active" ? "Active" : student.status === "pending" ? "Pending" : "Rejected"}
          </Badge>
        </CardContent>
      </Card>

      {/* Attendance summary — reused component */}
      <AttendanceSummary userId={student.id} />
    </div>
  );
}
