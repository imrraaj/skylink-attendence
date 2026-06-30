import { intlFormat } from "date-fns";

export const DISPLAY_TIME_ZONE = "America/New_York";

type DateInput = string | number | Date;
type DisplayDateParts = { year: number; month: number; day: number };
type DisplayDateTimeParts = DisplayDateParts & {
  hour: number;
  minute: number;
  second: number;
};

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

function getNumberPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  const numberValue = value ? Number.parseInt(value, 10) : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    throw new Error(`Could not read ${type} from ${DISPLAY_TIME_ZONE} date`);
  }

  return numberValue;
}

export function getDisplayDateParts(value: DateInput): DisplayDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(toDate(value));

  return {
    year: getNumberPart(parts, "year"),
    month: getNumberPart(parts, "month"),
    day: getNumberPart(parts, "day"),
  };
}

function getDisplayDateTimeParts(value: DateInput): DisplayDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(toDate(value));

  return {
    ...getDisplayDateParts(value),
    hour: getNumberPart(parts, "hour"),
    minute: getNumberPart(parts, "minute"),
    second: getNumberPart(parts, "second"),
  };
}

function getDisplayTimeZoneOffsetMs(value: Date): number {
  const parts = getDisplayDateTimeParts(value);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return localAsUtc - (value.getTime() - value.getMilliseconds());
}

export function getDisplayCalendarDate(value: DateInput = new Date()): Date {
  const { year, month, day } = getDisplayDateParts(value);
  return new Date(year, month - 1, day);
}

export function fromDisplayTimeZoneLocalDateTime({
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
}: DisplayDateParts & {
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  const firstPass = new Date(utcGuess.getTime() - getDisplayTimeZoneOffsetMs(utcGuess));
  const secondPass = new Date(utcGuess.getTime() - getDisplayTimeZoneOffsetMs(firstPass));

  return secondPass;
}

function padDateTimePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDisplayDateTimeLocalInput(value: DateInput | null): string {
  if (value == null) return "";

  const parts = getDisplayDateTimeParts(value);
  return [
    `${parts.year}-${padDateTimePart(parts.month)}-${padDateTimePart(parts.day)}`,
    `${padDateTimePart(parts.hour)}:${padDateTimePart(parts.minute)}`,
  ].join("T");
}

export function parseDisplayDateTimeLocalInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const hour = Number.parseInt(match[4], 10);
  const minute = Number.parseInt(match[5], 10);
  const second = match[6] ? Number.parseInt(match[6], 10) : 0;
  const localDate = new Date(year, month - 1, day);

  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  return fromDisplayTimeZoneLocalDateTime({ year, month, day, hour, minute, second });
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
