"use client";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SignInSchema, SignInValues } from "./validate";
import InputPasswordContainer from "../components/input-password";
import { cn } from "@/lib/utils";
import { Mail, Loader2 } from "lucide-react";

export default function SignInForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: SignInValues) {
    startTransition(async () => {
      const response = await signIn.email(data);

      if (response.error) {
        const msg = response.error.message ?? "";
        if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
          toast.error("Invalid email or password.");
        } else {
          toast.error(msg || "Sign in failed. Please try again.");
        }
      } else {
        const userData = response.data?.user as { role?: string; status?: string };
        if (userData?.status === "pending") {
          router.push("/pending");
        } else if (userData?.status === "rejected") {
          toast.error("Your registration was denied. Please contact support.");
        } else if (userData?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/student");
        }
        router.refresh();
      }
    });
  }

  const err = (f: keyof SignInValues) =>
    cn(form.formState.errors[f] && "border-destructive/80 text-destructive focus-visible:border-destructive/80 focus-visible:ring-destructive/20");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Email address"
                    type="email"
                    className={cn("pl-9", err("email"))}
                    disabled={isPending}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputPasswordContainer>
                  <Input
                    className={cn("pe-9", err("password"))}
                    placeholder="Password"
                    disabled={isPending}
                    {...field}
                  />
                </InputPasswordContainer>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="mt-2 w-full">
          {isPending ? <><Loader2 className="size-4 animate-spin mr-2" />Signing in...</> : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
