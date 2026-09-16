/**
 * Timestamp-safe date conversion for Firestore fields.
 *
 * Timeline `updatedAt` / `createdAt` may be an ISO string, a number, a Date,
 * or a Firestore Timestamp (toDate / seconds / _seconds). Invalid values must
 * never throw — sitemap lastmod used to 500 the whole endpoint.
 */

export function toDate(value: unknown): Date | undefined {
  if (value == null) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value === "object") {
    const record = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      _nanoseconds?: number;
    };

    if (typeof record.toDate === "function") {
      try {
        const date = record.toDate();
        return date instanceof Date && !Number.isNaN(date.getTime())
          ? date
          : undefined;
      } catch {
        return undefined;
      }
    }

    const seconds =
      typeof record.seconds === "number"
        ? record.seconds
        : typeof record._seconds === "number"
          ? record._seconds
          : undefined;
    if (typeof seconds === "number" && Number.isFinite(seconds)) {
      const nanos =
        typeof record.nanoseconds === "number"
          ? record.nanoseconds
          : typeof record._nanoseconds === "number"
            ? record._nanoseconds
            : 0;
      const date = new Date(seconds * 1000 + nanos / 1e6);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }
  }

  return undefined;
}

/** Sitemap lastmod is YYYY-MM-DD. Returns undefined if the value is unusable. */
export function toLastmodDate(value: unknown): string | undefined {
  const date = toDate(value);
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

/** Full ISO-8601 string, or undefined if the value is unusable. */
export function toIsoString(value: unknown): string | undefined {
  const date = toDate(value);
  if (!date) return undefined;
  return date.toISOString();
}
