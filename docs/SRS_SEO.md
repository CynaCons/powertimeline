# SEO Meta Tags Requirements (v0.8.7)

**Last Updated:** 2026-01-02

## Overview

Defines the SEO metadata requirements for PowerTimeline v0.8.7, covering document titles, descriptions, social sharing tags, and dynamic metadata for user-generated content. The implementation relies on `react-helmet-async` for per-route head management and focuses on Landing, Browse, Timeline, and User Profile pages.

## Requirements

| ID | Description | Priority | Status | Test Coverage |
|---|---|---|---|---|
| SEO-REQ-001 | HelmetProvider wraps the app to enable `react-helmet-async` on all routes (`src/main.tsx:27,130-138`). | Must | Implemented | Not covered (no automated SEO checks). |
| SEO-REQ-002 | Landing page sets page title and meta description for brand introduction (`src/pages/LandingPage.tsx:96-112`). | Must | Implemented | Not covered (manual verification). |
| SEO-REQ-003 | Landing page exposes Open Graph and Twitter Card tags with homepage URL and banner image (`src/pages/LandingPage.tsx:114-128`). | Must | Implemented | Not covered. |
| SEO-REQ-004 | Browse/Home page defines title and meta description for timeline discovery (`src/pages/HomePage.tsx:430-437`). | Must | Implemented | Not covered. |
| SEO-REQ-005 | Browse/Home page includes Open Graph and Twitter Card tags pointing to `/browse` (`src/pages/HomePage.tsx:439-452`). | Must | Implemented | Not covered. |
| SEO-REQ-006 | Timeline page renders dynamic title and description from timeline metadata (`src/pages/EditorPage.tsx:188-203,217-223`). | Must | Implemented | Not covered. |
| SEO-REQ-007 | Timeline page outputs Open Graph article data (type, url, title, description, image, published/modified times, author) tied to the loaded timeline (`src/pages/EditorPage.tsx:225-236`). | Must | Implemented | Not covered. |
| SEO-REQ-008 | Timeline page serves Twitter Card with dynamic title/description and banner image (`src/pages/EditorPage.tsx:238-243`). | Should | Implemented | Not covered. |
| SEO-REQ-009 | User profile page sets dynamic title and description summarizing timelines and events (`src/pages/UserProfilePage.tsx:236-245,270-276`). | Must | Implemented | Not covered. |
| SEO-REQ-010 | User profile page provides Open Graph profile tags plus Twitter Card metadata (`src/pages/UserProfilePage.tsx:278-292`). | Should | Implemented | Not covered. |
| SEO-REQ-011 | Canonical URLs are defined for Landing, Browse, Timeline, and User Profile pages to avoid duplicate indexing. | Should | Not Implemented | Not applicable. |
| SEO-REQ-012 | Structured data (JSON-LD) is published for timelines, users, or organization metadata. | Could | Not Implemented | Not applicable. |
