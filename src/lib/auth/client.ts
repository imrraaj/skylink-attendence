import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const { signIn, signUp, signOut, useSession, getSession, admin } =
  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
    plugins: [adminClient(), nextCookies()],
  });
