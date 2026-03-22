"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ChevronLeft, ChevronRight, UserCheck, Search } from "lucide-react";

type Student = {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  isCheckedIn: boolean;
  status: string;
};

type Filter = "" | "checked-in" | "checked-out";

export default function StudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("");
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

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filter) params.set("filter", filter);

    fetch(`/api/admin/students?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students ?? []);
        setHasMore((d.students ?? []).length === 20);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, filter]);

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
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={filter === "" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("")}
              >
                All
              </Button>
              <Button
                variant={filter === "checked-in" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("checked-in")}
              >
                <UserCheck className="size-3.5 mr-1" />
                Checked In
              </Button>
              <Button
                variant={filter === "checked-out" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("checked-out")}
              >
                Checked Out
              </Button>
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
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="size-10 mb-2 opacity-30" />
              <p className="text-sm">
                {debouncedSearch || filter ? "No students match your search or filter." : "No students found."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/admin/students/${s.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.isCheckedIn ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.isCheckedIn && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1">
                        <UserCheck className="size-3" />
                        Active
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </button>
              ))}
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
