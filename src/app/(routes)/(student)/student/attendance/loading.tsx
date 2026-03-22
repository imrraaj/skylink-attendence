import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AttendanceLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>

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
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-3" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
