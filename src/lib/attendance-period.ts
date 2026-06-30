import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek as startOfDateFnsWeek,
  startOfYear,
} from "date-fns";
import {
  fromDisplayTimeZoneLocalDateTime,
  getDisplayCalendarDate,
} from "@/lib/display-timezone";

export type AttendancePeriod = "today" | "week" | "month" | "year";

export function isAttendancePeriod(value: string): value is AttendancePeriod {
  return value === "today" || value === "week" || value === "month" || value === "year";
}

export function getStartOfWeek(date: Date): Date {
  return startOfDateFnsWeek(date, { weekStartsOn: 1 });
}

function parseCalendarDateParam(value?: string | null): Date | null {
  if (!value) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const year = Number.parseInt(dateOnlyMatch[1], 10);
    const month = Number.parseInt(dateOnlyMatch[2], 10);
    const day = Number.parseInt(dateOnlyMatch[3], 10);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }

    return null;
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? getDisplayCalendarDate(parsed) : null;
}

function startOfDisplayCalendarDate(date: Date): Date {
  return fromDisplayTimeZoneLocalDateTime({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

function endOfDisplayCalendarDate(date: Date): Date {
  return new Date(startOfDisplayCalendarDate(addDays(date, 1)).getTime() - 1);
}

export function getAttendancePeriodRange(
  period: AttendancePeriod | "custom",
  offset: number,
  fromStr?: string | null,
  toStr?: string | null,
): { start: Date; end: Date } {
  const now = getDisplayCalendarDate();

  if (period === "custom") {
    const from = parseCalendarDateParam(fromStr);
    const to = parseCalendarDateParam(toStr);
    if (from && to) {
      return {
        start: startOfDisplayCalendarDate(from),
        end: endOfDisplayCalendarDate(to),
      };
    }
  }

  if (period === "today") {
    const day = addDays(now, offset);
    return { start: startOfDisplayCalendarDate(day), end: endOfDisplayCalendarDate(day) };
  }

  if (period === "week") {
    const week = addWeeks(now, offset);
    const start = startOfDateFnsWeek(week, { weekStartsOn: 1 });
    const end = endOfWeek(week, { weekStartsOn: 1 });

    return {
      start: startOfDisplayCalendarDate(start),
      end: endOfDisplayCalendarDate(end),
    };
  }

  if (period === "month") {
    const month = addMonths(now, offset);
    const start = startOfMonth(month);
    const end = startOfMonth(addMonths(month, 1));

    return {
      start: startOfDisplayCalendarDate(start),
      end: new Date(startOfDisplayCalendarDate(end).getTime() - 1),
    };
  }

  if (period === "year") {
    const year = addYears(now, offset);
    const start = startOfYear(year);
    const end = startOfYear(addYears(year, 1));

    return {
      start: startOfDisplayCalendarDate(start),
      end: new Date(startOfDisplayCalendarDate(end).getTime() - 1),
    };
  }

  return { start: startOfDisplayCalendarDate(now), end: endOfDisplayCalendarDate(now) };
}
