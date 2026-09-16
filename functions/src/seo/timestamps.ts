/**
 * Convert Firestore/JS date values to a sitemap lastmod (YYYY-MM-DD).
 * Never throws — invalid values are omitted instead of 500ing the sitemap.
 */
export function toLastmodDate(value: unknown): string | undefined {
  try {
    const date = toDate(value);
    if (!date) return undefined;
    return date.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

export function toDate(value: unknown): Date | undefined {
  if (value == null || value === "") return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.toDate === "function") {
      try {
        const converted = record.toDate();
        if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
          return converted;
        }
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
    if (seconds != null) {
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
