"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileCheck, ChevronRight } from "lucide-react";

type Document = { id: string; type: string; originalFilename: string };
type Registration = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  documents: Document[];
};

export default function RegistrationsClient() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/registrations")
      .then((r) => r.json())
      .then((d) => setRegistrations(d.registrations ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending Registrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve or deny new student registrations
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3">
          {loading ? "..." : registrations.length} pending
        </Badge>
      </div>

      {loading ? (
        <Card>
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-3 w-20 hidden sm:block" />
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="size-4 ml-auto" />
              </div>
            ))}
          </div>
        </Card>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <FileCheck className="size-12 mb-3 opacity-30" />
            <p className="text-base font-medium">No pending registrations</p>
            <p className="text-sm">All caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow
                  key={reg.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/registrations/${reg.id}`)}
                >
                  <TableCell className="font-medium">{reg.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {reg.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={reg.documents.length === 2 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {reg.documents.length}/2
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
