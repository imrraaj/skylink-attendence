"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar } from "lucide-react";

type Period = "today" | "week" | "month" | "year";

type Session = {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
};

type SummaryData = {
  sessions: Session[];
  totalMinutes: number;
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function sessionDuration(s: Session): number {
  if (!s.checkOutAt) return 0;
  return Math.floor((new Date(s.checkOutAt).getTime() - new Date(s.checkInAt).getTime()) / 60000);
}

function PeriodContent({ userId, period }: { userId: string; period: Period }) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/summary?userId=${userId}&period=${period}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [userId, period]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted-foreground mt-4">Failed to load.</p>;

  return (
    <div className="mt-4 space-y-4">
      {/* Total time card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Clock className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Time</p>
            <p className="text-3xl font-bold text-foreground">{formatDuration(data.totalMinutes)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-xl font-semibold">{data.sessions.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sessions list */}
      {data.sessions.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <Calendar className="size-8 mb-2 opacity-40" />
          <p className="text-sm">No sessions recorded for this period.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.sessions.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">
                    {formatTime(s.checkInAt)}
                    {s.checkOutAt && (
                      <span className="text-muted-foreground"> → {formatTime(s.checkOutAt)}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(s.checkInAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.checkOutAt ? (
                  <Badge variant="secondary" className="text-xs">
                    {formatDuration(sessionDuration(s))}
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AttendanceSummary({ userId }: { userId: string }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">Attendance History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <TabsContent key={p} value={p}>
              <PeriodContent userId={userId} period={p} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
