"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, ChevronLeft, ChevronRight, UserCheck, Search } from "lucide-react";
import { format } from "date-fns";

type Student = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string | null;
  isCheckedIn: boolean;
  status: string;
  banned?: boolean;
  totalMinutes: number;
  activeCheckInAt: string | null;
  latestCheckOutAt: string | null;
};

type Filter = "" | "checked-in" | "checked-out";
type Period = "today" | "week" | "month" | "year";

const periodLabels: Record<Period, string> = {
  today: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatAttendanceTime(iso: string | null, period: Period): string {
  if (!iso) return "No time";
  return format(new Date(iso), period === "today" ? "hh:mm a" : "MMM d, hh:mm a");
}

function getRowAttendanceDisplay(student: Student, filter: Filter, period: Period) {
  if (filter === "checked-in") {
    return {
      label: "check in time",
      value: formatAttendanceTime(student.activeCheckInAt, period),
      empty: !student.activeCheckInAt,
    };
  }

  if (filter === "checked-out") {
    return {
      label: "check out time",
      value: formatAttendanceTime(student.latestCheckOutAt, period),
      empty: !student.latestCheckOutAt,
    };
  }

  return {
    label: `${periodLabels[period].toLowerCase()} total time`,
    value: formatDuration(student.totalMinutes),
    empty: false,
  };
}

export default function StudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("");
  const [period, setPeriod] = useState<Period>("week");
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setPage(1);
  }

  function handlePeriodChange(nextPeriod: Period) {
    setPeriod(nextPeriod);
    setPage(1);
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), role: "student", period });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filter) params.set("filter", filter);

    fetch(`/api/admin/students?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students ?? []);
        setHasMore((d.students ?? []).length === 20);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, filter, period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">All registered students and their attendance status</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Student List</CardTitle>
            {!loading && (
              <Badge variant="secondary">{students.length} shown</Badge>
            )}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-1">
              <Button
                variant={filter === "" ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("")}
              >
                All Status
              </Button>
              <Button
                variant={filter === "checked-in" ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("checked-in")}
              >
                <UserCheck className="size-3.5 mr-1" />
                Checked In
              </Button>
              <Button
                variant={filter === "checked-out" ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("checked-out")}
              >
                Checked Out
              </Button>
            </div>

            <div className="flex flex-col gap-1 sm:max-w-48">
              <Label htmlFor="student-period" className="text-xs text-muted-foreground">
                Attendance period
              </Label>
              <Select
                value={period}
                onValueChange={(value) => handlePeriodChange(value as Period)}
              >
                <SelectTrigger id="student-period" className="w-full">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {(["today", "week", "month", "year"] as Period[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {periodLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <GraduationCap className="size-10 mb-2 opacity-30" />
              <p className="text-sm">
                {debouncedSearch || filter ? "No students match your search or filter." : "No students found."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => {
                const attendanceDisplay = getRowAttendanceDisplay(s, filter, period);

                return (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/admin/students/${s.id}`)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${s.isCheckedIn ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{attendanceDisplay.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={attendanceDisplay.empty ? "secondary" : "outline"} className="text-xs">
                        {attendanceDisplay.value}
                      </Badge>
                      {s.banned && (
                        <Badge variant="destructive" className="text-xs">
                          Banned
                        </Badge>
                      )}
                      {s.isCheckedIn && !s.banned && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1">
                          <UserCheck className="size-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
