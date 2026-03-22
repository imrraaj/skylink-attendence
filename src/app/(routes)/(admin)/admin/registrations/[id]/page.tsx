import { type Metadata } from "next";
import RegistrationDetailClient from "./detail-client";

export const metadata: Metadata = { title: "Registration Detail" };

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RegistrationDetailClient userId={id} />;
}
