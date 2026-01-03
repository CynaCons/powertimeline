# PWA & Offline Requirements

**Last Updated:** 2026-01-02

This document captures requirements for PowerTimeline's progressive web app and offline resilience delivered in v0.8.5. It covers service worker lifecycle, caching strategies, installability, and offline UX.

## Overview

PowerTimeline's PWA implementation ensures:
- Auto-updating service worker registration in production builds for resilient caching.
- Offline-ready SPA shell with Workbox runtime caching for pages, static assets, and images.
- Installable experience via web app manifest, icons, and standalone display settings.
- In-app offline indicator with retry probe to restore connectivity.

## Requirement Table

| ID | Description | Priority | Status | Test Coverage |
|---|---|---|---|---|
| CC-REQ-PWA-001 | Service worker registers in production builds with immediate activation and error logging (`src/main.tsx:115-121`). | Must | Implemented (v0.8.5) | Not automated (Playwright TBD) |
| CC-REQ-PWA-002 | Service worker uses `autoUpdate` registration to pick up new deployments without manual reloads (`vite.config.ts:11`). | Must | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-003 | SPA navigation falls back to cached shell when offline via `navigateFallback: 'index.html'` (`vite.config.ts:35-36`). | Should | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-004 | Document requests use NetworkFirst with 3s network timeout and cache fallback (`vite.config.ts:39-51`). | Must | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-005 | Page cache capped at 50 entries with 7-day TTL to invalidate outdated navigations (`vite.config.ts:47-50`). | Should | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-006 | Static scripts/styles/workers cached via StaleWhileRevalidate with 30-day TTL and 100-entry cap (`vite.config.ts:54-67`). | Must | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-007 | Images cached via CacheFirst with 30-day TTL and 200-entry cap (`vite.config.ts:69-79`). | Could | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-008 | Workbox pre-caching targets core assets while excluding large media (`globPatterns`, `globIgnores`) to keep bundles lean (`vite.config.ts:34-35`). | Could | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-009 | Web app manifest defines installability metadata: name, short_name, start_url, standalone display, theme/background colors (`vite.config.ts:13-19`). | Must | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-010 | PWA icons present at 192px and 512px and included in build assets (`vite.config.ts:20-30`, `vite.config.ts:12`). | Must | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-011 | Offline indicator listens to `online`/`offline` events, defers banner by 800ms, and hides on reconnect (`src/components/OfflineIndicator.tsx:24-68`). | Should | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-012 | Retry action performs HEAD `/` probe with 4s abort timeout and prevents concurrent checks (`src/components/OfflineIndicator.tsx:70-99`). | Must | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-013 | Offline banner conveys status with `role="status"`, `aria-live="polite"`, spinner state, and centered fixed placement to avoid overlap (`src/components/OfflineIndicator.tsx:101-145`). | Should | Implemented (v0.8.5) | Not automated |
| CC-REQ-PWA-014 | Offline UI offers clear message and action (title + Retry button) with accent styling per design tokens (`src/components/OfflineIndicator.tsx:120-145`). | Could | Implemented (v0.8.5) | Not automated |

## Implementation Notes

- Service worker registration is gated to production builds and logs failures for observability (`src/main.tsx:115-121`).
- VitePWA uses `registerType: 'autoUpdate'` and Workbox runtime caching to balance freshness and offline safety (`vite.config.ts:11-83`).
- Manifest provides required install metadata and icons for add-to-home-screen flows (`vite.config.ts:13-30`).
- Offline banner uses browser online/offline events plus a HEAD probe to reduce false positives and includes accessibility roles (`src/components/OfflineIndicator.tsx`).

## Test Coverage

- No automated Playwright coverage currently exercises offline/PWA behaviors; add e2e scenarios for service worker registration, offline navigation fallback, cache hit/miss expectations, and offline indicator retry handling.
