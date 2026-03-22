import { type Metadata } from "next";
import RegistrationsClient from "./registrations-client";

export const metadata: Metadata = { title: "Pending Registrations" };

export default function RegistrationsPage() {
  return <RegistrationsClient />;
}
