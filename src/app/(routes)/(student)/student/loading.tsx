import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Timer card */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-36" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>

      {/* Attendance history */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Skeleton className="h-9 w-full rounded-md" />
          <Card className="border-muted">
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
