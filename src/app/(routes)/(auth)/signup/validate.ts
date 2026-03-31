import { passwordSchema } from "@/lib/auth/password";
import { z } from "zod";

export const Step1Schema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.email({ message: "Enter a valid email address" }),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["student", "instructor"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type Step1Values = z.infer<typeof Step1Schema>;
