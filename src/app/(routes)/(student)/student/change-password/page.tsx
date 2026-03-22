import { type Metadata } from "next";
import { getServerSession } from "@/lib/auth/get-session";
import ChangePasswordForm from "@/components/change-password-form";

export const metadata: Metadata = { title: "Change Password" };

export default async function StudentChangePasswordPage() {
  const session = await getServerSession();
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your account password</p>
      </div>
      <ChangePasswordForm email={session!.user.email} />
    </div>
  );
}
