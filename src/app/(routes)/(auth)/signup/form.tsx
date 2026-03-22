"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signUp } from "@/lib/auth/client";
import { Step1Schema, Step1Values } from "./validate";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import InputPasswordContainer from "../components/input-password";
import { cn } from "@/lib/utils";
import {
  User, Mail, Loader2, Upload, FileCheck, AlertCircle,
  CheckCircle2, ArrowLeft
} from "lucide-react";

type DocFile = { file: File; preview: string } | null;

export default function SignUpForm() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [isPending, startTransition] = useTransition();
  const [academyId, setAcademyId] = useState<DocFile>(null);
  const [governmentId, setGovernmentId] = useState<DocFile>(null);
  const academyRef = useRef<HTMLInputElement>(null);
  const govRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<Step1Values>({
    resolver: zodResolver(Step1Schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const err = (f: keyof Step1Values) =>
    cn(form.formState.errors[f] && "border-destructive/80 text-destructive focus-visible:border-destructive/80 focus-visible:ring-destructive/20");

  function handleStep1(data: Step1Values) {
    setStep1Data(data);
    setStep(2);
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: DocFile) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, or PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.");
      return;
    }

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";
    setter({ file, preview });
  }

  function handleSubmit() {
    if (!step1Data || !academyId || !governmentId) {
      toast.error("Please upload both documents.");
      return;
    }

    startTransition(async () => {
      // Step 1: Create the account (status will be "pending" by default)
      const res = await signUp.email({
        name: step1Data.name,
        email: step1Data.email,
        password: step1Data.password,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Registration failed. Please try again.");
        setStep(1);
        return;
      }

      // Step 2: Upload documents
      try {
        const formData = new FormData();
        formData.append("academy_id", academyId.file);
        formData.append("government_id", governmentId.file);

        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          toast.error(data.error ?? "Document upload failed. Please contact support.");
        }
      } catch {
        toast.error("Document upload failed. Please contact support.");
      }

      router.push("/pending");
    });
  }

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span className={step === 1 ? "text-primary font-semibold" : ""}>Account Details</span>
          <span className={step === 2 ? "text-primary font-semibold" : ""}>ID Verification</span>
        </div>
        <Progress value={step === 1 ? 50 : 100} className="h-1.5" />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleStep1)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input placeholder="Full name" className={cn("pl-9", err("name"))} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input placeholder="Email address" type="email" className={cn("pl-9", err("email"))} {...field} />
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
                      <Input placeholder="Password" className={cn("pe-9", err("password"))} {...field} />
                    </InputPasswordContainer>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputPasswordContainer>
                      <Input placeholder="Confirm password" className={cn("pe-9", err("confirmPassword"))} {...field} />
                    </InputPasswordContainer>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-2 w-full">
              Continue to ID Verification
            </Button>
          </form>
        </Form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-accent/10 border border-accent/20 p-3 flex gap-2">
            <AlertCircle className="size-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Upload clear photos of your documents. These are encrypted and only visible to admins for verification.
            </p>
          </div>

          {/* Academy ID */}
          <FileUploadZone
            label="Academy ID"
            description="Your Skylink Aviation Academy student ID card"
            file={academyId}
            inputRef={academyRef}
            onChange={(e) => handleFileChange(e, setAcademyId)}
            accept="image/jpeg,image/jpg,image/png,application/pdf"
          />

          {/* Government ID */}
          <FileUploadZone
            label="Passport / Government ID"
            description="National ID, passport, or equivalent"
            file={governmentId}
            inputRef={govRef}
            onChange={(e) => handleFileChange(e, setGovernmentId)}
            accept="image/jpeg,image/jpg,image/png,application/pdf"
          />

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
              disabled={isPending}
            >
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isPending || !academyId || !governmentId}
            >
              {isPending ? (
                <><Loader2 className="size-4 animate-spin mr-2" />Submitting...</>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FileUploadZone({
  label,
  description,
  file,
  inputRef,
  onChange,
  accept,
}: {
  label: string;
  description: string;
  file: DocFile;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full border-2 border-dashed rounded-xl p-4 transition-colors text-left",
          file
            ? "border-green-500/50 bg-green-50 dark:bg-green-950/20"
            : "border-border hover:border-accent/50 hover:bg-accent/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center gap-3">
            {file.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.preview} alt="" className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FileCheck className="size-5 text-green-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{file.file.name}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="size-3" /> Ready to upload
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Click to upload</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, or PDF — max 5MB</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
