import { type Metadata } from "next";
import SignUpForm from "./form";
import Link from "next/link";
import { Plane } from "lucide-react";

export const metadata: Metadata = { title: "Register" };

export default function SignUpPage() {
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

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Register for Skylink Aviation Academy</p>
        </div>

        <SignUpForm />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="text-accent font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} Skylink Aviation Academy. All rights reserved.
      </p>
    </div>
  );
}
