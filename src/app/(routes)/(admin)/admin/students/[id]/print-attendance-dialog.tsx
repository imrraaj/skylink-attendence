"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Printer, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pdf, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatDisplayFullDate, formatDisplayTime } from "@/lib/display-timezone";

// --- PDF Generate Function --- //
type Session = { checkInAt: string; checkOutAt: string | null };

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 11, color: "#4b5563", marginBottom: 2 },
  table: { display: "flex", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#e5e7eb" },
  tableRow: { margin: "auto", flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tableHeader: { backgroundColor: "#f3f4f6", fontWeight: "bold" },
  tableCol: { width: "25%", padding: 5, borderRightWidth: 1, borderRightColor: "#e5e7eb" },
  tableColLast: { width: "25%", padding: 5 },
  tableCell: { fontSize: 9 },
  statsBox: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, padding: 10, backgroundColor: "#f8fafc", borderRadius: 4, borderWidth: 1, borderColor: "#e2e8f0" },
  statText: { fontSize: 10, fontWeight: "bold" },
});

function PdfDocument({
  sessions,
  studentName,
  startDate,
  endDate,
  totalMinutes,
}: {
  sessions: Session[];
  studentName: string;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
}) {
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Attendance Report</Text>
          <Text style={styles.subtitle}>Student: {studentName}</Text>
          <Text style={styles.subtitle}>
            Period: {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
          </Text>
        </View>

        <View style={styles.statsBox}>
          <Text style={styles.statText}>Total Sessions: {sessions.length}</Text>
          <Text style={styles.statText}>
            Total Mismatched Time: {totalHours}h {remainingMins}m
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Date</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Check In</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Check Out</Text></View>
            <View style={styles.tableColLast}><Text style={styles.tableCell}>Duration</Text></View>
          </View>

          {sessions.map((s, i) => {
            const dateStr = formatDisplayFullDate(s.checkInAt);
            const inStr = formatDisplayTime(s.checkInAt);
            let outStr = "-";
            let durStr = "-";

            if (s.checkOutAt) {
              outStr = formatDisplayTime(s.checkOutAt);
              const diffMins = Math.floor((new Date(s.checkOutAt).getTime() - new Date(s.checkInAt).getTime()) / 60000);
              const h = Math.floor(diffMins / 60);
              const m = diffMins % 60;
              durStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
            } else {
              outStr = "Active";
            }

            return (
              <View style={styles.tableRow} key={i}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{dateStr}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{inStr}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{outStr}</Text></View>
                <View style={styles.tableColLast}><Text style={styles.tableCell}>{durStr}</Text></View>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}

// --- Component --- //

export default function PrintAttendanceDialog({
  userId,
  studentName,
  className,
}: {
  userId: string;
  studentName: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Default to current month
  const now = new Date();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  });

  async function handleDownload() {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a valid date range");
      return;
    }
    
    setGenerating(true);
    try {
      const fromIso = dateRange.from.toISOString();
      const toIso = dateRange.to.toISOString();
      
      const res = await fetch(`/api/attendance/summary?userId=${userId}&period=custom&from=${fromIso}&to=${toIso}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      
      const doc = <PdfDocument 
        sessions={data.sessions} 
        studentName={studentName} 
        startDate={dateRange.from} 
        endDate={dateRange.to} 
        totalMinutes={data.totalMinutes} 
      />;
      
      const asPdf = pdf();
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Attendance_${studentName.replace(/\s+/g, "_")}_${format(dateRange.from, "MMM_yyyy")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF generated successfully");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className={cn(className)}>
        <Printer className="size-4 mr-1.5" />
        Print Attendance
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Attendance PDF</DialogTitle>
            <DialogDescription>
              Select a date range to generate an attendance report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal min-w-0">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal min-w-0">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={generating} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleDownload} disabled={generating} className="w-full sm:w-auto">
              {generating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Printer className="size-4 mr-1.5" />}
              {generating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
