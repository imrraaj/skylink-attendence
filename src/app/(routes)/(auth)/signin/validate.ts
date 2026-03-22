import { z } from "zod";

export const SignInSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type SignInValues = z.infer<typeof SignInSchema>;
