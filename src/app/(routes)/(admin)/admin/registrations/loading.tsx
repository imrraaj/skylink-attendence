import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function RegistrationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <Card>
        <div className="space-y-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-20 hidden sm:block" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="size-4 ml-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
