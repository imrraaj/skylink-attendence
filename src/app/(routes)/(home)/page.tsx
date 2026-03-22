import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/get-session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plane, Shield, Clock, Users } from "lucide-react";

export default async function Home() {
  const session = await getServerSession();

  if (session?.user) {
    if (session.user.role === "admin") redirect("/admin");
    else redirect("/student");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Plane className="size-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-primary">Skylink</span>
              <span className="text-xs text-muted-foreground ml-1">Aviation Academy</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
          <Plane className="size-3 text-accent" />
          <span className="text-xs text-accent font-medium">Attendance Management System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 max-w-2xl leading-tight">
          Skylink Aviation Academy
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl">
          Professional attendance tracking for students and administrators. Simple, secure, and reliable.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
          {[
            { icon: Clock, title: "Track Attendance", desc: "Check in and out with a single tap. View your daily, weekly, and monthly hours." },
            { icon: Shield, title: "Secure & Private", desc: "Your data is protected. ID documents are encrypted and only accessible to admins." },
            { icon: Users, title: "Admin Dashboard", desc: "Admins can manage registrations, view all attendance, and oversee the academy." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5 text-left">
              <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3">
                <Icon className="size-4 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skylink Aviation Academy. All rights reserved.
      </footer>
    </div>
  );
}
