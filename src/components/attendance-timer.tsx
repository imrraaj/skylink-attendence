"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";

type ActiveSession = { id: string; checkInAt: string; checkOutAt: null };

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AttendanceTimer() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      setActiveSession(data.activeSession);
      if (data.activeSession) {
        const ms = Date.now() - new Date(data.activeSession.checkInAt).getTime();
        setElapsed(ms);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Tick timer
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const ms = Date.now() - new Date(activeSession.checkInAt).getTime();
      setElapsed(ms);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  async function handleAction(action: "check-in" | "check-out") {
    setIsPending(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      if (action === "check-in") {
        setActiveSession(data.session);
        setElapsed(0);
        toast.success("Checked in successfully!");
      } else {
        setActiveSession(null);
        setElapsed(0);
        toast.success("Checked out successfully!");
        window.location.reload();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 transition-colors ${activeSession ? "border-green-500/40 bg-green-50/50 dark:bg-green-950/20" : "border-border"}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Timer display */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <Clock className={`size-4 ${activeSession ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium text-muted-foreground">
                {activeSession ? "Session in progress" : "Not checked in"}
              </span>
            </div>

            {activeSession ? (
              <>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-foreground tracking-wider">
                  {formatElapsed(elapsed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Started at {formatTime(activeSession.checkInAt)}
                </p>
              </>
            ) : (
              <p className="text-3xl sm:text-4xl font-mono font-bold text-muted-foreground/40 tracking-wider">
                00:00:00
              </p>
            )}
          </div>

          {/* Action button */}
          <div className="w-full sm:w-auto">
            {activeSession ? (
              <Button
                size="lg"
                variant="destructive"
                onClick={() => handleAction("check-out")}
                disabled={isPending}
                className="w-full sm:w-auto sm:min-w-32"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <><LogOut className="size-4 mr-2" />Check Out</>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => handleAction("check-in")}
                disabled={isPending}
                className="w-full sm:w-auto sm:min-w-32 bg-green-600 hover:bg-green-700 text-white"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <><LogIn className="size-4 mr-2" />Check In</>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
