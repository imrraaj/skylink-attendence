"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import InputPasswordContainer from "@/app/(routes)/(auth)/components/input-password";

export default function CreateAdminClient() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setSuccess(true);
      setForm({ name: "", email: "", password: "" });
      toast.success("Admin account created successfully!");
    } catch {
      toast.error("Failed to create admin. Please try again.");
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
            <p className="text-sm text-green-700 dark:text-green-400">
              Admin account created. Share the credentials securely.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@skylink.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <InputPasswordContainer>
              <Input
                id="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
                className="pe-9"
              />
            </InputPasswordContainer>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? <><Loader2 className="size-4 animate-spin mr-2" />Creating...</> : "Create Admin Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
