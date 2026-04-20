import { intlFormat } from "date-fns";

export const DISPLAY_TIME_ZONE = "America/New_York";

type DateInput = string | number | Date;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatInDisplayTimeZone(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
): string {
  return intlFormat(
    toDate(value),
    { ...options, timeZone: DISPLAY_TIME_ZONE },
    { locale: "en-US" },
  );
}

export function formatDisplayTime(value: DateInput): string {
  return formatInDisplayTimeZone(value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDisplayShortDate(value: DateInput): string {
  return formatInDisplayTimeZone(value, {
    month: "short",
    day: "numeric",
  });
}

export function formatDisplayShortDateTime(value: DateInput): string {
  return formatInDisplayTimeZone(value, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDisplayFullDate(value: DateInput): string {
  return formatInDisplayTimeZone(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDisplayWeekdayDate(value: DateInput): string {
  return formatInDisplayTimeZone(value, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
