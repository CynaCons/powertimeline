# Chronochart Product Requirements

## Overview
Chronochart is a web application that lets users build and view interactive timelines.

## Goals
- Provide a modern and responsive interface for creating timeline events.
- Enable editing and rearranging events, editing text descriptions and dates
- Support exporting timelines for sharing or embedding.
- Provide visually appealing and epurated UI for visualisation of events across time


## Non-Goals (yet)
- Real-time collaborative editing.
- Mobile native applications.
- Media content other than text 
- User Accounts

## User Stories
- As a user, I can add, edit, and delete events on a timeline.
- As a user, I can zoom and pan across large timelines to explore different periods.
- As a user, I can see a visual indicator of my current position when zoomed into a timeline.
- As a user, I can click on a timeline overview to quickly navigate to specific time periods.
- As a user, I can export a timeline to share with others.

## Technical Requirements
- Built with React, TypeScript, and Tailwind CSS.
- Timelines are rendered using SVG for scalability.
- State is persisted in the browser using local storage.

## Success Metrics
- Users can create and save a timeline without errors.
- Performance remains smooth with 100 events on screen.
- Visual UI allows having a high level perspective of the timeline AND a detailed zoomed-in experience of one or more events
- Users can navigate to any timeline period within 2 seconds using zoom and minimap navigation
- Zoom behavior feels stable and predictable (events stay under cursor during zoom operations)

