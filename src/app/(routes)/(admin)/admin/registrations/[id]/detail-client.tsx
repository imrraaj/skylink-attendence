"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ZoomIn,
} from "lucide-react";

type Document = {
  id: string;
  type: string;
  originalFilename: string;
  mimeType: string;
};

type Registration = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  documents: Document[];
};

export default function RegistrationDetailClient({ userId }: { userId: string }) {
  const [reg, setReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [viewModal, setViewModal] = useState<{ label: string; url: string; mimeType: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/registrations")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.registrations ?? []).find(
          (r: Registration) => r.id === userId
        );
        setReg(found ?? null);

        // Load document signed URLs
        if (found?.documents) {
          found.documents.forEach((doc: Document) => {
            fetch(`/api/documents/view?id=${doc.id}`)
              .then((r) => r.json())
              .then((data) => {
                if (data.url) {
                  setDocUrls((prev) => ({ ...prev, [doc.id]: data.url }));
                }
              })
              .catch(() => { });
          });
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleAction(action: "approve" | "deny") {
    setProcessing(action);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success(
        action === "approve" ? "Account approved!" : "Registration denied."
      );
      router.push("/admin/registrations");
      router.refresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-3.5 w-56" />
          </div>
        </div>
        {/* Student info skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </CardContent>
        </Card>
        {/* Documents skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reg) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/registrations")}
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to Registrations
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <AlertTriangle className="size-10 mb-3 opacity-50" />
            <p className="text-base font-medium">Registration not found</p>
            <p className="text-sm">
              This registration may have already been processed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const academyDoc = reg.documents.find((d) => d.type === "academy_id");
  const governmentDoc = reg.documents.find((d) => d.type === "government_id");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/registrations")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Registration Detail</h1>
          <p className="text-sm text-muted-foreground">
            Review student details and documents
          </p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{reg.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{reg.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Registered {new Date(reg.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="pt-1">
            <Badge
              variant="outline"
              className="text-orange-500 border-orange-500/30"
            >
              Pending Approval
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" />
            Submitted Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reg.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No documents uploaded
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <DocumentViewer
                label="Academy ID"
                doc={academyDoc}
                url={academyDoc ? docUrls[academyDoc.id] : undefined}
                onView={(url, mimeType) => setViewModal({ label: "Academy ID", url, mimeType })}
              />
              <DocumentViewer
                label="Government ID"
                doc={governmentDoc}
                url={governmentDoc ? docUrls[governmentDoc.id] : undefined}
                onView={(url, mimeType) => setViewModal({ label: "Government ID", url, mimeType })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAction("approve")}
              disabled={!!processing}
            >
              {processing === "approve" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="size-4 mr-1.5" />
                  Approve Registration
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleAction("deny")}
              disabled={!!processing}
            >
              {processing === "deny" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="size-4 mr-1.5" />
                  Deny Registration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document fullscreen modal */}
      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewModal?.label}</DialogTitle>
          </DialogHeader>
          {viewModal && (
            viewModal.mimeType === "application/pdf" ? (
              <iframe src={viewModal.url} className="w-full h-[75vh] rounded-lg" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewModal.url}
                alt={viewModal.label}
                className="w-full max-h-[75vh] object-contain rounded-lg"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentViewer({
  label,
  doc,
  url,
  onView,
}: {
  label: string;
  doc?: Document;
  url?: string;
  onView?: (url: string, mimeType: string) => void;
}) {
  if (!doc) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        <FileText className="size-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs">Not uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground truncate max-w-32">
          {doc.originalFilename}
        </span>
      </div>
      <button
        type="button"
        className="w-full rounded-lg border overflow-hidden bg-muted/30 cursor-pointer relative group"
        onClick={() => url && onView?.(url, doc.mimeType)}
        disabled={!url}
      >
        {!url ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : doc.mimeType === "application/pdf" ? (
          <iframe src={url} className="w-full h-64 pointer-events-none" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="w-full h-64 object-contain"
          />
        )}
        {url && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <ZoomIn className="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
    </div>
  );
}
