"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getStartOfWeek, type AttendancePeriod } from "@/lib/attendance-period";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  differenceInMinutes,
  endOfMonth,
  endOfYear,
  format,
  getMonth,
  getYear,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";

type Period = AttendancePeriod;

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
  return format(new Date(iso), "hh:mm a");
}

function formatDate(iso: string): string {
  return format(new Date(iso), "MMM d");
}

function getPeriodDateRange(period: Period, offset: number): string {
  const now = new Date();
  const fmt = (d: Date) => format(d, "MMM d");

  if (period === "today") {
    return fmt(addDays(now, offset));
  }

  if (period === "week") {
    const start = addWeeks(getStartOfWeek(now), offset);
    const end = addDays(start, 6);
    return `${fmt(start)} – ${fmt(end)}`;
  }

  if (period === "month") {
    const month = addMonths(now, offset);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return `${fmt(start)} – ${fmt(end)}`;
  }

  const year = addYears(now, offset);
  return `${fmt(startOfYear(year))} – ${format(endOfYear(year), "MMM d, yyyy")}`;
}

function getSelectedDateForPeriod(period: Period, offset: number): Date {
  const now = new Date();
  if (period === "today") {
    return addDays(now, offset);
  }
  if (period === "week") {
    return addWeeks(getStartOfWeek(now), offset);
  }
  if (period === "month") {
    return startOfMonth(addMonths(now, offset));
  }
  return startOfYear(addYears(now, offset));
}

function sessionDuration(s: Session): number {
  if (!s.checkOutAt) return 0;
  return differenceInMinutes(new Date(s.checkOutAt), new Date(s.checkInAt));
}

function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

// Month picker grid
function MonthPicker({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [year, setYear] = useState(getYear(selected));
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
            variant={i === getMonth(selected) && year === getYear(selected) ? "default" : "outline"}
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
  const currentYear = getYear(new Date());
  const [decadeStart, setDecadeStart] = useState(Math.floor(getYear(selected) / 10) * 10);
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
            variant={y === getYear(selected) ? "default" : "outline"}
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
      onOffsetChange(differenceInCalendarDays(startOfDay(date), startOfDay(now)));
    } else if (period === "week") {
      const currentWeekStart = getStartOfWeek(now);
      const selectedWeekStart = getStartOfWeek(date);
      onOffsetChange(differenceInCalendarWeeks(selectedWeekStart, currentWeekStart, { weekStartsOn: 1 }));
    }
    setOpen(false);
  }

  function handleMonthSelect(date: Date) {
    onOffsetChange(differenceInCalendarMonths(date, now));
    setOpen(false);
  }

  function handleYearSelect(date: Date) {
    onOffsetChange(differenceInCalendarYears(date, now));
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-start">
      <Button variant="ghost" size="icon" className="size-7" onClick={() => onOffsetChange(offset - 1)}>
        <ChevronLeft className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-[110px] sm:min-w-[130px] justify-center rounded-md px-2 py-1 hover:bg-muted">
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
              weekStartsOn={1}
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

function EditSessionDialog({
  session,
  onSaved,
}: {
  session: Session;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    checkInAt: toDateTimeLocalValue(session.checkInAt),
    checkOutAt: toDateTimeLocalValue(session.checkOutAt),
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      checkInAt: toDateTimeLocalValue(session.checkInAt),
      checkOutAt: toDateTimeLocalValue(session.checkOutAt),
    });
  }, [open, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/attendance/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInAt: new Date(form.checkInAt).toISOString(),
          checkOutAt: form.checkOutAt ? new Date(form.checkOutAt).toISOString() : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update attendance entry");
        return;
      }

      toast.success("Attendance entry updated");
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <Pencil className="size-3.5" />
          <span className="sr-only">Edit attendance entry</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Attendance Entry</DialogTitle>
          <DialogDescription>Update the check-in or check-out time for this entry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`check-in-${session.id}`}>Check In</Label>
            <Input
              id={`check-in-${session.id}`}
              type="datetime-local"
              value={form.checkInAt}
              onChange={(event) => setForm((current) => ({ ...current, checkInAt: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`check-out-${session.id}`}>Check Out</Label>
            <Input
              id={`check-out-${session.id}`}
              type="datetime-local"
              value={form.checkOutAt}
              onChange={(event) => setForm((current) => ({ ...current, checkOutAt: event.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Leave empty if the session is still active.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PeriodContent({
  userId,
  period,
  offset,
  canManage,
}: {
  userId: string;
  period: Period;
  offset: number;
  canManage: boolean;
}) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    function handleAttendanceUpdated(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId === userId) load();
    }

    window.addEventListener("attendance-updated", handleAttendanceUpdated);
    return () => window.removeEventListener("attendance-updated", handleAttendanceUpdated);
  }, [load, userId]);

  async function handleDelete(sessionId: string) {
    if (!window.confirm("Delete this attendance entry?")) return;

    setDeletingId(sessionId);
    try {
      const res = await fetch(`/api/attendance/${sessionId}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to delete attendance entry");
        return;
      }

      toast.success("Attendance entry deleted");
      load();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {/* Total time card skeleton */}
        <Card className="border-muted">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="sm:ml-auto sm:text-right space-y-1.5">
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
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Clock className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Time</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{formatDuration(data.totalMinutes)}</p>
          </div>
          <div className="sm:ml-auto sm:text-right">
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
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
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
                  <p className="text-xs text-muted-foreground">
                    {s.checkOutAt ? "check in/out time" : "check in time"} • {formatDate(s.checkInAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                {s.checkOutAt ? (
                  <Badge variant="secondary" className="text-xs">
                    {formatDuration(sessionDuration(s))}
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    Active
                  </Badge>
                )}
                {canManage && (
                  <>
                    <EditSessionDialog session={s} onSaved={load} />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                    >
                      {deletingId === s.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      <span className="sr-only">Delete attendance entry</span>
                    </Button>
                  </>
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
  today: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

export default function AttendanceSummary({
  userId,
  canManage = false,
}: {
  userId: string;
  canManage?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Period>("week");
  const [offset, setOffset] = useState(0);

  function handleTabChange(tab: Period) {
    setActiveTab(tab);
    setOffset(0);
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base font-semibold">Attendance History</CardTitle>
          <DateRangePicker period={activeTab} offset={offset} onOffsetChange={setOffset} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as Period)}>
          <TabsList className="w-full grid grid-cols-4">
            {(["today", "week", "month", "year"] as Period[]).map((p) => (
              <TabsTrigger key={p} value={p}>{periodLabels[p]}</TabsTrigger>
            ))}
          </TabsList>
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <TabsContent key={p} value={p}>
              <PeriodContent userId={userId} period={p} offset={activeTab === p ? offset : 0} canManage={canManage} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
