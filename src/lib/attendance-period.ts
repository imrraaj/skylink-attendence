import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek as startOfDateFnsWeek,
  startOfYear,
} from "date-fns";

export type AttendancePeriod = "today" | "week" | "month" | "year";

export function isAttendancePeriod(value: string): value is AttendancePeriod {
  return value === "today" || value === "week" || value === "month" || value === "year";
}

export function getStartOfWeek(date: Date): Date {
  return startOfDateFnsWeek(date, { weekStartsOn: 1 });
}

function parseDateParam(value?: string | null): Date | null {
  if (!value) return null;

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function getAttendancePeriodRange(
  period: AttendancePeriod | "custom",
  offset: number,
  fromStr?: string | null,
  toStr?: string | null,
): { start: Date; end: Date } {
  const now = new Date();

  if (period === "custom") {
    const from = parseDateParam(fromStr);
    const to = parseDateParam(toStr);
    if (from && to) {
      return { start: startOfDay(from), end: endOfDay(to) };
    }
  }

  if (period === "today") {
    const day = addDays(now, offset);
    return { start: startOfDay(day), end: endOfDay(day) };
  }

  if (period === "week") {
    const week = addWeeks(now, offset);
    return {
      start: startOfDateFnsWeek(week, { weekStartsOn: 1 }),
      end: endOfWeek(week, { weekStartsOn: 1 }),
    };
  }

  if (period === "month") {
    const month = addMonths(now, offset);
    return { start: startOfMonth(month), end: endOfMonth(month) };
  }

  if (period === "year") {
    const year = addYears(now, offset);
    return { start: startOfYear(year), end: endOfYear(year) };
  }

  return { start: startOfDay(now), end: endOfDay(now) };
}
