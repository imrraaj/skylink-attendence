import { type Metadata } from "next";
import CreateAdminClient from "./create-admin-client";

export const metadata: Metadata = { title: "Create Admin" };

export default function CreateAdminPage() {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Create Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new administrator account</p>
      </div>
      <CreateAdminClient />
    </div>
  );
}
