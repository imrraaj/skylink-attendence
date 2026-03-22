import { type Metadata } from "next";
import Link from "next/link";
import { Plane, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Registration Pending" };

export default function PendingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
          <Plane className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">Skylink</p>
          <p className="text-sm font-bold text-primary leading-tight">Aviation Academy</p>
        </div>
      </div>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mx-auto mb-6">
          <Clock className="size-8 text-accent" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Registration Submitted</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for registering with Skylink Aviation Academy. Your application is under review.
        </p>

        <div className="bg-muted/50 rounded-xl p-4 text-left mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="size-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Application received</p>
              <p className="text-xs text-muted-foreground">Your details and documents have been submitted</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-4 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admin review</p>
              <p className="text-xs text-muted-foreground">An admin will verify your documents</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-4 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account activation</p>
              <p className="text-xs text-muted-foreground">You&apos;ll be able to sign in once approved</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          If you have any questions, please contact the academy administration directly.
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/signin">Back to Sign In</Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skylink Aviation Academy. All rights reserved.
      </p>
    </div>
  );
}
