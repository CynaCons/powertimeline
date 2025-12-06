# SRS: User Settings Page
Version: 1.0 | Date: 2025-12-06

## Overview
The User Settings Page allows authenticated users to manage their account preferences, security settings, and profile information at the `/settings` route. It integrates with Firebase Auth for password management and provides controls for theme preferences, default timeline visibility, and account deletion.

## Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **Access Control** |
| CC-REQ-SETTINGS-001 | Only authenticated users can access /settings. | Must | Implemented |
| CC-REQ-SETTINGS-002 | Unauthenticated visitors are redirected to /login when accessing /settings. | Must | Implemented |
| **Profile Section** |
| CC-REQ-SETTINGS-003 | Display current username (read-only). | Must | Implemented |
| CC-REQ-SETTINGS-004 | Display email address (read-only). | Must | Implemented |
| CC-REQ-SETTINGS-005 | Display member since date (account creation date). | Should | Implemented |
| CC-REQ-SETTINGS-006 | Display total count of user's timelines. | Should | Implemented |
| **Security Section** |
| CC-REQ-SETTINGS-007 | "Change Password" button opens Firebase password reset flow. | Must | Implemented |
| CC-REQ-SETTINGS-008 | "Sign Out of All Devices" functionality. | Could | Planned |
| CC-REQ-SETTINGS-009 | Display last password change date if available from Firebase. | Could | Planned |
| **Preferences Section** |
| CC-REQ-SETTINGS-010 | Theme toggle between Dark and Light modes. | Must | Implemented |
| CC-REQ-SETTINGS-011 | Theme preference is persisted to localStorage. | Must | Implemented |
| CC-REQ-SETTINGS-012 | Default timeline visibility selector (Public/Private) for new timelines. | Should | Planned |
| CC-REQ-SETTINGS-013 | Default visibility preference is persisted to user profile in Firestore. | Should | Planned |
| **Danger Zone** |
| CC-REQ-SETTINGS-014 | "Delete Account" button with visual danger styling. | Must | Implemented |
| CC-REQ-SETTINGS-015 | Account deletion requires confirmation dialog with explicit user consent. | Must | Planned |
| CC-REQ-SETTINGS-016 | Account deletion requires re-authentication before proceeding. | Must | Planned |
| CC-REQ-SETTINGS-017 | Account deletion removes user profile document from Firestore. | Must | Planned |
| CC-REQ-SETTINGS-018 | Account deletion removes all timelines owned by the user. | Must | Planned |
| CC-REQ-SETTINGS-019 | Account deletion removes user from Firebase Auth. | Must | Planned |
| CC-REQ-SETTINGS-020 | Danger Zone includes GDPR compliance notice. | Should | Planned |
| **Navigation** |
| CC-REQ-SETTINGS-021 | Back button returns user to previous page. | Should | Implemented |
| CC-REQ-SETTINGS-022 | Settings page is accessible from user menu in TopNavBar. | Must | Implemented |
| CC-REQ-SETTINGS-023 | Settings page uses consistent navigation structure with app layout. | Must | Implemented |

## Test Coverage
| Requirement | Test File | Test Case |
|-------------|-----------|-----------|
| — | — | — |
