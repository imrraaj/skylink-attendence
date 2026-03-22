"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

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

function getStartOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

function getPeriodDateRange(period: Period, offset: number): string {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });

  if (period === "today") {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return fmt(d);
  }

  if (period === "week") {
    const start = getStartOfWeek(now);
    start.setDate(start.getDate() + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${fmt(start)} – ${fmt(end)}`;
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return `${fmt(start)} – ${fmt(end)}`;
  }

  const year = now.getFullYear() + offset;
  return `Jan 1 – Dec 31, ${year}`;
}

function getSelectedDateForPeriod(period: Period, offset: number): Date {
  const now = new Date();
  if (period === "today") {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  }
  if (period === "week") {
    const start = getStartOfWeek(now);
    start.setDate(start.getDate() + offset * 7);
    return start;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  }
  return new Date(now.getFullYear() + offset, 0, 1);
}

function sessionDuration(s: Session): number {
  if (!s.checkOutAt) return 0;
  return Math.floor((new Date(s.checkOutAt).getTime() - new Date(s.checkInAt).getTime()) / 60000);
}

// Month picker grid
function MonthPicker({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [year, setYear] = useState(selected.getFullYear());
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">{year}</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, i) => (
          <Button
            key={m}
            variant={i === selected.getMonth() && year === selected.getFullYear() ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => onSelect(new Date(year, i, 1))}
          >
            {m}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Year picker grid
function YearPicker({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const currentYear = new Date().getFullYear();
  const [decadeStart, setDecadeStart] = useState(Math.floor(selected.getFullYear() / 10) * 10);
  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setDecadeStart((d) => d - 10)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">{decadeStart} – {decadeStart + 9}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setDecadeStart((d) => d + 10)}
          disabled={decadeStart + 10 > currentYear}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((y) => (
          <Button
            key={y}
            variant={y === selected.getFullYear() ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => onSelect(new Date(y, 0, 1))}
          >
            {y}
          </Button>
        ))}
      </div>
    </div>
  );
}

function DateRangePicker({
  period,
  offset,
  onOffsetChange,
}: {
  period: Period;
  offset: number;
  onOffsetChange: (offset: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const selectedDate = getSelectedDateForPeriod(period, offset);

  function handleDaySelect(date: Date | undefined) {
    if (!date) return;
    if (period === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      onOffsetChange(diffDays);
    } else if (period === "week") {
      const currentWeekStart = getStartOfWeek(now);
      const selectedWeekStart = getStartOfWeek(date);
      const diffWeeks = Math.round((selectedWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      onOffsetChange(diffWeeks);
    }
    setOpen(false);
  }

  function handleMonthSelect(date: Date) {
    const diffMonths = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
    onOffsetChange(diffMonths);
    setOpen(false);
  }

  function handleYearSelect(date: Date) {
    const diffYears = date.getFullYear() - now.getFullYear();
    onOffsetChange(diffYears);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="size-7" onClick={() => onOffsetChange(offset - 1)}>
        <ChevronLeft className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-[130px] justify-center rounded-md px-2 py-1 hover:bg-muted">
            <CalendarIcon className="size-3" />
            {getPeriodDateRange(period, offset)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          {(period === "today" || period === "week") && (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              defaultMonth={selectedDate}
              disabled={{ after: new Date() }}
            />
          )}
          {period === "month" && (
            <MonthPicker selected={selectedDate} onSelect={handleMonthSelect} />
          )}
          {period === "year" && (
            <YearPicker selected={selectedDate} onSelect={handleYearSelect} />
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => onOffsetChange(offset + 1)}
        disabled={offset >= 0}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function PeriodContent({ userId, period, offset }: { userId: string; period: Period; offset: number }) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/summary?userId=${userId}&period=${period}&offset=${offset}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [userId, period, offset]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {/* Total time card skeleton */}
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
        {/* Session rows skeleton */}
        {[1, 2, 3].map((i) => (
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
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted-foreground mt-4">Failed to load.</p>;

  return (
    <div className="mt-4 space-y-4">
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

      {data.sessions.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <CalendarIcon className="size-8 mb-2 opacity-40" />
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

const periodLabels: Record<Period, string> = {
  today: "Today",
  week: "Week",
  month: "Month",
  year: "Year",
};

export default function AttendanceSummary({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<Period>("today");
  const [offset, setOffset] = useState(0);

  function handleTabChange(tab: Period) {
    setActiveTab(tab);
    setOffset(0);
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Attendance History</CardTitle>
          <DateRangePicker period={activeTab} offset={offset} onOffsetChange={setOffset} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" onValueChange={(v) => handleTabChange(v as Period)}>
          <TabsList className="w-full grid grid-cols-4">
            {(["today", "week", "month", "year"] as Period[]).map((p) => (
              <TabsTrigger key={p} value={p}>{periodLabels[p]}</TabsTrigger>
            ))}
          </TabsList>
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <TabsContent key={p} value={p}>
              <PeriodContent userId={userId} period={p} offset={activeTab === p ? offset : 0} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
