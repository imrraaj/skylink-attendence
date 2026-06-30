import { type Metadata } from "next";
import StudentsClient from "../students/students-client";

export const metadata: Metadata = { title: "Graduated" };

export default function GraduatedPage() {
  return <StudentsClient mode="graduated" />;
}
