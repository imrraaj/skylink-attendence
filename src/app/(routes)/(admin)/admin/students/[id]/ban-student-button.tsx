"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

export default function BanStudentButton({
  userId,
  isBanned,
  studentName,
}: {
  userId: string;
  isBanned: boolean;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction() {
    setLoading(true);
    const action = isBanned ? "unban" : "ban";
    
    try {
      const res = await fetch(`/api/admin/students/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error ?? `Failed to ${action} student`);
        return;
      }
      
      toast.success(isBanned ? "Student unbanned successfully" : "Student banned successfully");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(`Failed to ${action} student`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button 
        variant={isBanned ? "secondary" : "destructive"} 
        size="sm" 
        onClick={() => setOpen(true)}
      >
        {isBanned ? (
          <><ShieldCheck className="size-4 mr-1.5" />Unban Student</>
        ) : (
          <><ShieldAlert className="size-4 mr-1.5" />Ban Student</>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBanned ? "Unban Student" : "Ban Student"}</DialogTitle>
            <DialogDescription>
              {isBanned ? (
                <>Are you sure you want to unban <strong>{studentName}</strong>? They will be able to log in and mark attendance again.</>
              ) : (
                <>Are you sure you want to ban <strong>{studentName}</strong>? Their status and history will remain, but they will not be able to log in to the application.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant={isBanned ? "default" : "destructive"} 
              onClick={handleAction} 
              disabled={loading}
            >
              {loading && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {isBanned ? "Yes, Unban Student" : "Yes, Ban Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
