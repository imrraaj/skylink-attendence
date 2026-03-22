import { passwordSchema } from "@/lib/auth/password";
import { z } from "zod";

export const Step1Schema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.email({ message: "Enter a valid email address" }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type Step1Values = z.infer<typeof Step1Schema>;
