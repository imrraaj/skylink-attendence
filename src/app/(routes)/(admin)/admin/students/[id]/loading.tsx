import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function StudentDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      </div>

      {/* Student info card */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-52" />
            <Skeleton className="h-3 w-36" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
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
              <div className="ml-auto text-right space-y-1.5">
                <Skeleton className="h-3 w-14 ml-auto" />
                <Skeleton className="h-6 w-8 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
