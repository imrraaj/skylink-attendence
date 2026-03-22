"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { signIn } from "@/lib/auth/client";
import InputPasswordContainer from "@/app/(routes)/(auth)/components/input-password";

export default function ChangePasswordForm({ email }: { email: string }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.current || !form.next || !form.confirm) {
      toast.error("All fields are required.");
      return;
    }
    if (form.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (form.next !== form.confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      // Verify current password by attempting sign-in
      const verify = await signIn.email({ email, password: form.current });
      if (verify.error) {
        toast.error("Current password is incorrect.");
        setLoading(false);
        return;
      }

      // Change password via Better Auth
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to change password."); return; }

      setSuccess(true);
      setForm({ current: "", next: "", confirm: "" });
      toast.success("Password changed successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {success && (
          <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-500/20">
            <CheckCircle className="size-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">Password changed successfully.</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <InputPasswordContainer>
              <Input
                placeholder="Your current password"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                disabled={loading}
                className="pe-9"
              />
            </InputPasswordContainer>
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <InputPasswordContainer>
              <Input
                placeholder="At least 8 characters"
                value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })}
                disabled={loading}
                className="pe-9"
              />
            </InputPasswordContainer>
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <InputPasswordContainer>
              <Input
                placeholder="Repeat new password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                disabled={loading}
                className="pe-9"
              />
            </InputPasswordContainer>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? <><Loader2 className="size-4 animate-spin mr-2" />Changing...</> : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
