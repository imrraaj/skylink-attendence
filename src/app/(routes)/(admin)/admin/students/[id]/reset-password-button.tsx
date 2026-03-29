"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResetPasswordButton({ userId, className }: { userId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${userId}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reset password");
        return;
      }
      toast.success("Password reset to default (Skylink@123)");
      setOpen(false);
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className={cn(className)}>
        <KeyRound className="size-4 mr-1.5" />
        Reset Password
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Student Password</DialogTitle>
            <DialogDescription>
              This will reset the student&apos;s password to the default: <strong>Skylink@123</strong>. The student can then log in and change it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleReset} disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <KeyRound className="size-4 mr-1.5" />}
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
