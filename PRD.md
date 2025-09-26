# ChronoChart Product Requirements Document

## Executive Summary
ChronoChart is evolving from a timeline visualization tool into a collaborative platform for documenting historical events. Think "**GitHub for Timelines**" - where users can create, fork, merge, and contribute to collective documentation of history.

## Product Vision

### Current State (v0.3.x)
A sophisticated timeline visualization tool with advanced layout engine, event editing capabilities, and export functionality.

### Future State (v0.4.x+)
A collaborative platform where historians, researchers, students, and enthusiasts can:
- Create and maintain comprehensive timelines
- Fork existing timelines to build upon others' work
- Submit merge requests to contribute improvements
- Discover and follow interesting timelines and creators
- Build a collective knowledge base of historical events

## Goals

### Phase 1: Foundation (v0.3.x - Current)
- ✅ Modern, responsive interface for timeline creation and editing
- ✅ Advanced layout engine with degradation system and overflow handling
- ✅ Export/import functionality for timeline sharing
- ✅ Sophisticated visual design with minimap navigation and zoom controls

### Phase 2: Platform Transformation (v0.4.x+)
- **User Management**: Account creation, authentication, and user profiles
- **Timeline Persistence**: Cloud storage and version control for timelines
- **Collaboration**: Fork/merge workflow similar to Git version control
- **Discovery**: Timeline gallery, search, and categorization system
- **Social Features**: Follow users, activity feeds, and engagement metrics
- **Rich Media**: Image/video attachments and content archival
- **AI Integration**: Intelligent timeline assistance and automation

## Non-Goals

### Current Non-Goals
- Real-time collaborative editing (planned for v0.5.x)
- Mobile native applications (web-responsive design sufficient)
- Complex multimedia editing tools (focus on timeline structure)

### Permanent Non-Goals
- Social media-style viral content optimization
- Monetization through advertising or subscription paywalls
- Political bias or editorial content curation

## User Stories

### Current Timeline Features (v0.3.x)
- As a user, I can add, edit, and delete events on a timeline
- As a user, I can zoom and pan across large timelines to explore different periods
- As a user, I can see a visual indicator of my current position when zoomed into a timeline
- As a user, I can click on a timeline overview to quickly navigate to specific time periods
- As a user, I can export a timeline to share with others
- As a user, I can import timelines from YAML files
- As a user, I can navigate between events using keyboard shortcuts and visual previews

### Collaborative Platform Features (v0.4.x+)

#### User Management & Authentication (Demo Phase)
- As a demo user, I can switch between predefined user profiles (Alice, Bob, Charlie)
- As a demo user, I can see my profile information and owned timelines
- As a demo user, I can manage my timeline library within the demo environment

#### Timeline Collaboration
- As a user, I can fork someone else's timeline to build upon their work
- As a timeline creator, I can receive merge requests from other users
- As a contributor, I can submit improvements to existing timelines
- As a user, I can see the fork history and attribution for any timeline

#### Discovery & Social Features
- As a user, I can browse a gallery of public timelines by category
- As a user, I can search for timelines about specific topics or time periods
- As a user, I can follow timeline creators whose work interests me
- As a user, I can see trending and popular timelines
- As a user, I can receive notifications about updates to timelines I follow

#### Version Control & History
- As a timeline owner, I can see the complete version history of my timeline
- As a user, I can compare different versions of a timeline side-by-side
- As a user, I can revert to previous versions if needed
- As a collaborator, I can see what changes were made in each version

#### Content Enhancement
- As a user, I can embed external media (YouTube videos, social media posts) in timeline events
- As a user, I can add links with automatic preview generation
- As a user, I can organize events with tags and categories
- As a researcher, I can cite sources and add verification for events

#### Landing Page & Discovery
- As a user, I can view all my created timelines in "My Timelines" section
- As a timeline owner, I can see pull requests submitted to my timelines
- As a user, I can discover popular timelines through "Most Popular" feed
- As a user, I can find recently active timelines through "Most Active" feed
- As a user, I can search for timelines by title, description, or content
- As an anonymous user, I can browse public timelines without creating an account
- As a user, I can navigate from landing page to timeline viewer/editor
- As a user, I can access any timeline via GitHub-style URLs (user/timeline-name)

## Technical Requirements

### Current Architecture (v0.3.x)
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Rendering**: SVG-based timeline visualization for scalability
- **Storage**: Local browser storage for timeline persistence
- **Testing**: Playwright end-to-end test suite (65+ tests)
- **Layout Engine**: Advanced deterministic layout with degradation system

### Platform Architecture (v0.4.x+)
- **Backend**: Internal Git repositories for timeline storage (not exposed publicly)
- **Storage**: Internal Git repositories with JSON format in local/server filesystem
- **Authentication**: Demo user system (3 predefined users for development)
- **Git Integration**: Internal Git operations using simple-git or NodeGit libraries
- **Version Control**: Native Git version control with commit history (internal only)
- **Media Integration**: External media embedding (YouTube, social media) - no file storage
- **Discovery**: Timeline statistics and popularity tracking within demo environment
- **URL Structure**: GitHub-style URLs (chronochart.com/user/timeline-name) for demo users
- **Sharing**: Public timeline access for demo timelines without authentication

### Security & Performance
- **Data Privacy**: GDPR-compliant user data handling
- **Content Security**: XSS protection and input sanitization
- **Performance**: Sub-2 second page loads, smooth 60fps timeline interactions
- **Scalability**: Support for 10,000+ concurrent users
- **Reliability**: 99.9% uptime with automated backups

## Success Metrics

### Current Success Metrics (v0.3.x)
- ✅ Users can create and save timelines without errors
- ✅ Performance remains smooth with 100+ events on screen
- ✅ Visual UI provides both high-level overview and detailed zoom experience
- ✅ Users can navigate to any timeline period within 2 seconds
- ✅ Zoom behavior feels stable and predictable

### Platform Success Metrics (v0.4.x+)

#### User Engagement (Development Phase)
- **Timeline Creation**: Successfully create and save timelines to internal Git repositories
- **Demo User System**: Seamless switching between Alice, Bob, and Charlie profiles
- **Timeline Access**: Demo timelines accessible via GitHub-style URLs
- **Landing Page Usage**: Demo users can discover and navigate timelines from home page

#### Internal Git-Based Storage
- **Repository Creation**: Each timeline generates properly structured internal Git repository
- **Version History**: All timeline changes tracked through internal Git commits
- **Fork Functionality**: Demo users can fork timelines and maintain attribution
- **Public Access**: Anonymous users can view demo timelines without authentication

#### Discovery & Navigation
- **Landing Page**: "My Timelines", "Popular", and "Active" feeds populate with demo data
- **URL Structure**: GitHub-style user/timeline-name routing works for demo users
- **Search**: Timeline search returns relevant results from demo timeline pool
- **Statistics**: View counts and activity metrics tracked for demo environment

#### Technical Performance
- **Internal Git Integration**: Reliable repository operations via simple-git/NodeGit
- **JSON Format**: Timeline data correctly serialized/deserialized
- **Demo Authentication**: User switching between demo profiles works seamlessly
- **Timeline Rendering**: Existing 500+ event performance maintained

