/**
 * Timeline Automation API
 * RESTful HTTP endpoints for programmatic event management.
 * Authenticated via Bearer tokens (not Firebase Auth).
 *
 * Endpoints:
 *   GET    /api/v1/timelines/:timelineId/events         - List events
 *   POST   /api/v1/timelines/:timelineId/events         - Create event
 *   POST   /api/v1/timelines/:timelineId/events/bulk    - Bulk create events
 *   PUT    /api/v1/timelines/:timelineId/events/:eventId - Update event
 *   DELETE /api/v1/timelines/:timelineId/events/:eventId - Delete event
 */

import { onRequest, type Request } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { Response } from "express";
import {
  validateToken,
  hashToken,
  checkRateLimit,
  isValidTokenFormat,
} from "./tokenService";

function getDb() {
  return admin.firestore();
}

// ============================================================================
// Types
// ============================================================================

interface ApiRequest {
  userId: string;
  timelineId: string;
  eventId?: string;
}

interface EventInput {
  date: string;
  title: string;
  description?: string;
  endDate?: string;
  time?: string;
  sources?: string[];
}

// ============================================================================
// Response Helpers
// ============================================================================

function sendError(
  res: Response,
  code: string,
  message: string,
  status: number
): void {
  res.status(status).json({ error: { code, message, status } });
}

function sendSuccess(
  res: Response,
  data: Record<string, unknown>,
  status = 200
): void {
  res.status(status).json(data);
}

// ============================================================================
// CORS
// ============================================================================

function setCorsHeaders(res: Response): void {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Max-Age", "3600");
}

// ============================================================================
// Route Parsing
// ============================================================================

interface ParsedRoute {
  timelineId: string;
  eventId?: string;
  isBulk: boolean;
}

/**
 * Parse the URL path to extract timelineId, eventId, and whether it's a bulk operation.
 * Expected patterns:
 *   /api/v1/timelines/:timelineId/events
 *   /api/v1/timelines/:timelineId/events/bulk
 *   /api/v1/timelines/:timelineId/events/:eventId
 */
function parseRoute(path: string): ParsedRoute | null {
  // Normalize: remove trailing slash
  const normalized = path.replace(/\/$/, "");

  const match = normalized.match(
    /^\/api\/v1\/timelines\/([^/]+)\/events(?:\/(.+))?$/
  );
  if (!match) return null;

  const timelineId = match[1];
  const rest = match[2];

  if (!rest) {
    return { timelineId, isBulk: false };
  }

  if (rest === "bulk") {
    return { timelineId, isBulk: true };
  }

  return { timelineId, eventId: rest, isBulk: false };
}

// ============================================================================
// Auth Middleware
// ============================================================================

async function authenticate(
  req: Request,
  res: Response
): Promise<ApiRequest | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(
      res,
      "UNAUTHORIZED",
      "Missing or invalid Authorization header. Expected: Bearer pt_<token>",
      401
    );
    return null;
  }

  const rawToken = authHeader.slice("Bearer ".length);

  if (!isValidTokenFormat(rawToken)) {
    sendError(
      res,
      "UNAUTHORIZED",
      "Invalid token format. Expected: pt_ followed by 64 hex characters",
      401
    );
    return null;
  }

  // Rate limit check
  const tokenHash = hashToken(rawToken);
  if (!checkRateLimit(tokenHash)) {
    res.set("Retry-After", "60");
    sendError(
      res,
      "RATE_LIMITED",
      "Rate limit exceeded. Maximum 60 requests per minute.",
      429
    );
    return null;
  }

  // Validate token
  const tokenResult = await validateToken(rawToken);
  if (!tokenResult) {
    sendError(res, "UNAUTHORIZED", "Invalid or revoked API token", 401);
    return null;
  }

  // Parse route to get timelineId
  const route = parseRoute(req.path);
  if (!route) {
    sendError(res, "NOT_FOUND", "Invalid API path", 404);
    return null;
  }

  // Verify timeline ownership
  const timelineDoc = await getDb()
    .doc(
      `users/${tokenResult.userId}/timelines/${route.timelineId}`
    )
    .get();

  if (!timelineDoc.exists) {
    sendError(res, "NOT_FOUND", "Timeline not found", 404);
    return null;
  }

  return {
    userId: tokenResult.userId,
    timelineId: route.timelineId,
    eventId: route.eventId,
  };
}

// ============================================================================
// Input Validation
// ============================================================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

function isValidDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr + "T00:00:00Z");
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

function isValidTime(timeStr: string): boolean {
  if (!TIME_REGEX.test(timeStr)) return false;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function validateEventInput(data: unknown): {
  event: EventInput;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { event: {} as EventInput, errors: ["Request body must be a JSON object"] };
  }

  const obj = data as Record<string, unknown>;

  // Required: date
  if (!obj.date || typeof obj.date !== "string") {
    errors.push("'date' is required and must be a string in YYYY-MM-DD format");
  } else if (!isValidDate(obj.date)) {
    errors.push("'date' must be a valid date in YYYY-MM-DD format");
  }

  // Required: title
  if (!obj.title || typeof obj.title !== "string" || obj.title.trim().length === 0) {
    errors.push("'title' is required and must be a non-empty string");
  } else if (obj.title.length > 200) {
    errors.push("'title' must be at most 200 characters");
  }

  // Optional: description
  if (obj.description !== undefined) {
    if (typeof obj.description !== "string") {
      errors.push("'description' must be a string");
    } else if (obj.description.length > 5000) {
      errors.push("'description' must be at most 5000 characters");
    }
  }

  // Optional: endDate
  if (obj.endDate !== undefined) {
    if (typeof obj.endDate !== "string") {
      errors.push("'endDate' must be a string in YYYY-MM-DD format");
    } else if (!isValidDate(obj.endDate)) {
      errors.push("'endDate' must be a valid date in YYYY-MM-DD format");
    } else if (
      typeof obj.date === "string" &&
      isValidDate(obj.date) &&
      obj.endDate < obj.date
    ) {
      errors.push("'endDate' must be on or after 'date'");
    }
  }

  // Optional: time
  if (obj.time !== undefined) {
    if (typeof obj.time !== "string") {
      errors.push("'time' must be a string in HH:MM format");
    } else if (!isValidTime(obj.time)) {
      errors.push("'time' must be a valid time in HH:MM 24-hour format");
    }
  }

  // Optional: sources
  if (obj.sources !== undefined) {
    if (!Array.isArray(obj.sources)) {
      errors.push("'sources' must be an array of strings");
    } else if (obj.sources.length > 20) {
      errors.push("'sources' must have at most 20 items");
    } else {
      for (let i = 0; i < obj.sources.length; i++) {
        if (typeof obj.sources[i] !== "string") {
          errors.push(`'sources[${i}]' must be a string`);
        } else if ((obj.sources[i] as string).length > 2000) {
          errors.push(`'sources[${i}]' must be at most 2000 characters`);
        }
      }
    }
  }

  // Build clean event input (strip server-managed fields)
  const event: EventInput = {
    date: typeof obj.date === "string" ? obj.date : "",
    title: typeof obj.title === "string" ? obj.title.trim() : "",
  };
  if (typeof obj.description === "string") event.description = obj.description;
  if (typeof obj.endDate === "string" && isValidDate(obj.endDate))
    event.endDate = obj.endDate;
  if (typeof obj.time === "string" && isValidTime(obj.time))
    event.time = obj.time;
  if (Array.isArray(obj.sources))
    event.sources = obj.sources.filter(
      (s): s is string => typeof s === "string"
    );

  return { event, errors };
}

// ============================================================================
// Event Handlers
// ============================================================================

function eventsCollection(userId: string, timelineId: string) {
  return getDb().collection(
    `users/${userId}/timelines/${timelineId}/events`
  );
}

async function handleListEvents(
  req: Request,
  res: Response,
  ctx: ApiRequest
): Promise<void> {
  const snapshot = await eventsCollection(ctx.userId, ctx.timelineId)
    .orderBy("date", "asc")
    .get();

  const events = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date,
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.endDate && { endDate: data.endDate }),
      ...(data.time && { time: data.time }),
      ...(data.sources && { sources: data.sources }),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  sendSuccess(res, {
    events,
    count: events.length,
    timelineId: ctx.timelineId,
  });
}

async function handleCreateEvent(
  req: Request,
  res: Response,
  ctx: ApiRequest
): Promise<void> {
  const { event, errors } = validateEventInput(req.body);
  if (errors.length > 0) {
    sendError(res, "VALIDATION_ERROR", errors.join("; "), 400);
    return;
  }

  const now = new Date().toISOString();
  const eventRef = eventsCollection(ctx.userId, ctx.timelineId).doc();

  const eventDoc = {
    ...event,
    id: eventRef.id,
    timelineId: ctx.timelineId,
    createdAt: now,
    updatedAt: now,
  };

  await eventRef.set(eventDoc);

  // Update timeline's eventCount and updatedAt
  await getDb()
    .doc(`users/${ctx.userId}/timelines/${ctx.timelineId}`)
    .update({
      eventCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

  sendSuccess(
    res,
    {
      id: eventRef.id,
      date: event.date,
      title: event.title,
      ...(event.description && { description: event.description }),
      ...(event.endDate && { endDate: event.endDate }),
      ...(event.time && { time: event.time }),
      ...(event.sources && { sources: event.sources }),
      createdAt: now,
      updatedAt: now,
    },
    201
  );
}

async function handleBulkCreateEvents(
  req: Request,
  res: Response,
  ctx: ApiRequest
): Promise<void> {
  const body = req.body;
  if (!body || !Array.isArray(body.events)) {
    sendError(
      res,
      "VALIDATION_ERROR",
      "Request body must contain an 'events' array",
      400
    );
    return;
  }

  if (body.events.length === 0) {
    sendError(res, "VALIDATION_ERROR", "'events' array must not be empty", 400);
    return;
  }

  if (body.events.length > 50) {
    sendError(
      res,
      "VALIDATION_ERROR",
      "'events' array must have at most 50 items",
      400
    );
    return;
  }

  // Validate all events first
  const allErrors: string[] = [];
  const validatedEvents: EventInput[] = [];

  for (let i = 0; i < body.events.length; i++) {
    const { event, errors } = validateEventInput(body.events[i]);
    if (errors.length > 0) {
      allErrors.push(`Event ${i}: ${errors.join("; ")}`);
    } else {
      validatedEvents.push(event);
    }
  }

  if (allErrors.length > 0) {
    sendError(res, "VALIDATION_ERROR", allErrors.join(". "), 400);
    return;
  }

  const now = new Date().toISOString();
  const batch = getDb().batch();
  const created: Record<string, unknown>[] = [];

  for (const event of validatedEvents) {
    const eventRef = eventsCollection(ctx.userId, ctx.timelineId).doc();
    const eventDoc = {
      ...event,
      id: eventRef.id,
      timelineId: ctx.timelineId,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(eventRef, eventDoc);
    created.push({
      id: eventRef.id,
      date: event.date,
      title: event.title,
      ...(event.description && { description: event.description }),
      ...(event.endDate && { endDate: event.endDate }),
      ...(event.time && { time: event.time }),
      ...(event.sources && { sources: event.sources }),
      createdAt: now,
      updatedAt: now,
    });
  }

  // Update timeline eventCount
  batch.update(
    getDb().doc(`users/${ctx.userId}/timelines/${ctx.timelineId}`),
    {
      eventCount: admin.firestore.FieldValue.increment(validatedEvents.length),
      updatedAt: now,
    }
  );

  await batch.commit();

  sendSuccess(res, { created, count: created.length }, 201);
}

async function handleUpdateEvent(
  req: Request,
  res: Response,
  ctx: ApiRequest
): Promise<void> {
  if (!ctx.eventId) {
    sendError(res, "VALIDATION_ERROR", "Event ID is required", 400);
    return;
  }

  const eventRef = eventsCollection(ctx.userId, ctx.timelineId).doc(
    ctx.eventId
  );
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    sendError(res, "NOT_FOUND", "Event not found", 404);
    return;
  }

  // For updates, only validate provided fields
  const body = req.body;
  if (!body || typeof body !== "object") {
    sendError(res, "VALIDATION_ERROR", "Request body must be a JSON object", 400);
    return;
  }

  const updates: Record<string, unknown> = {};
  const errors: string[] = [];

  if (body.date !== undefined) {
    if (typeof body.date !== "string" || !isValidDate(body.date)) {
      errors.push("'date' must be a valid date in YYYY-MM-DD format");
    } else {
      updates.date = body.date;
    }
  }

  if (body.title !== undefined) {
    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0
    ) {
      errors.push("'title' must be a non-empty string");
    } else if (body.title.length > 200) {
      errors.push("'title' must be at most 200 characters");
    } else {
      updates.title = body.title.trim();
    }
  }

  if (body.description !== undefined) {
    if (body.description === null) {
      updates.description = admin.firestore.FieldValue.delete();
    } else if (typeof body.description !== "string") {
      errors.push("'description' must be a string or null");
    } else if (body.description.length > 5000) {
      errors.push("'description' must be at most 5000 characters");
    } else {
      updates.description = body.description;
    }
  }

  if (body.endDate !== undefined) {
    if (body.endDate === null) {
      updates.endDate = admin.firestore.FieldValue.delete();
    } else if (typeof body.endDate !== "string" || !isValidDate(body.endDate)) {
      errors.push("'endDate' must be a valid date in YYYY-MM-DD format or null");
    } else {
      updates.endDate = body.endDate;
    }
  }

  if (body.time !== undefined) {
    if (body.time === null) {
      updates.time = admin.firestore.FieldValue.delete();
    } else if (typeof body.time !== "string" || !isValidTime(body.time)) {
      errors.push("'time' must be a valid time in HH:MM format or null");
    } else {
      updates.time = body.time;
    }
  }

  if (body.sources !== undefined) {
    if (body.sources === null) {
      updates.sources = admin.firestore.FieldValue.delete();
    } else if (!Array.isArray(body.sources)) {
      errors.push("'sources' must be an array of strings or null");
    } else if (body.sources.length > 20) {
      errors.push("'sources' must have at most 20 items");
    } else {
      for (let i = 0; i < body.sources.length; i++) {
        if (typeof body.sources[i] !== "string") {
          errors.push(`'sources[${i}]' must be a string`);
        } else if (body.sources[i].length > 2000) {
          errors.push(`'sources[${i}]' must be at most 2000 characters`);
        }
      }
      if (errors.length === 0) {
        updates.sources = body.sources;
      }
    }
  }

  if (errors.length > 0) {
    sendError(res, "VALIDATION_ERROR", errors.join("; "), 400);
    return;
  }

  if (Object.keys(updates).length === 0) {
    sendError(
      res,
      "VALIDATION_ERROR",
      "No valid fields to update. Updatable fields: date, title, description, endDate, time, sources",
      400
    );
    return;
  }

  const now = new Date().toISOString();
  updates.updatedAt = now;

  await eventRef.update(updates);

  // Fetch updated document to return full state
  const updatedDoc = await eventRef.get();
  const updatedData = updatedDoc.data()!;

  sendSuccess(res, {
    id: ctx.eventId,
    date: updatedData.date,
    title: updatedData.title,
    ...(updatedData.description && { description: updatedData.description }),
    ...(updatedData.endDate && { endDate: updatedData.endDate }),
    ...(updatedData.time && { time: updatedData.time }),
    ...(updatedData.sources && { sources: updatedData.sources }),
    createdAt: updatedData.createdAt,
    updatedAt: updatedData.updatedAt,
  });
}

async function handleDeleteEvent(
  req: Request,
  res: Response,
  ctx: ApiRequest
): Promise<void> {
  if (!ctx.eventId) {
    sendError(res, "VALIDATION_ERROR", "Event ID is required", 400);
    return;
  }

  const eventRef = eventsCollection(ctx.userId, ctx.timelineId).doc(
    ctx.eventId
  );
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    sendError(res, "NOT_FOUND", "Event not found", 404);
    return;
  }

  await eventRef.delete();

  // Update timeline's eventCount
  const now = new Date().toISOString();
  await getDb()
    .doc(`users/${ctx.userId}/timelines/${ctx.timelineId}`)
    .update({
      eventCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: now,
    });

  sendSuccess(res, { deleted: true, id: ctx.eventId });
}

// ============================================================================
// Main Router
// ============================================================================

export const api = onRequest(async (req, res) => {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Parse route
  const route = parseRoute(req.path);
  if (!route) {
    sendError(res, "NOT_FOUND", "Invalid API path", 404);
    return;
  }

  // Authenticate
  const ctx = await authenticate(req, res);
  if (!ctx) return; // authenticate already sent error response

  try {
    // Route to handler
    if (route.isBulk && req.method === "POST") {
      await handleBulkCreateEvents(req, res, ctx);
    } else if (!route.eventId) {
      // /api/v1/timelines/:timelineId/events
      switch (req.method) {
        case "GET":
          await handleListEvents(req, res, ctx);
          break;
        case "POST":
          await handleCreateEvent(req, res, ctx);
          break;
        default:
          sendError(
            res,
            "NOT_FOUND",
            `Method ${req.method} not allowed on this endpoint`,
            405
          );
      }
    } else {
      // /api/v1/timelines/:timelineId/events/:eventId
      switch (req.method) {
        case "PUT":
          await handleUpdateEvent(req, res, ctx);
          break;
        case "DELETE":
          await handleDeleteEvent(req, res, ctx);
          break;
        default:
          sendError(
            res,
            "NOT_FOUND",
            `Method ${req.method} not allowed on this endpoint`,
            405
          );
      }
    }
  } catch (error) {
    logger.error("API error:", error);
    sendError(res, "INTERNAL_ERROR", "An internal error occurred", 500);
  }
});
