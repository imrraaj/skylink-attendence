import { type Metadata } from "next";
import InstructorsClient from "./instructors-client";

export const metadata: Metadata = { title: "Instructors" };

export default function InstructorsPage() {
  return <InstructorsClient />;
}
