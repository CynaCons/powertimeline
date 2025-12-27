# SRS: User Settings Page
Version: 1.0 | Date: 2025-12-27

## Overview
The User Settings Page allows authenticated users to manage their account preferences, security settings, and profile information at the `/settings` route. It integrates with Firebase Auth for password management and provides controls for theme preferences, default timeline visibility, and account deletion.

## Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| **Access Control** |
| CC-REQ-SETTINGS-001 | Only authenticated users can access /settings. | Route protected, auth check on mount | SettingsPage.tsx:27-29 | — |
| CC-REQ-SETTINGS-002 | Unauthenticated visitors are redirected to /login when accessing /settings. | Navigate("/login") when user=null | SettingsPage.tsx:27-29 | — |
| **Profile Section** |
| CC-REQ-SETTINGS-003 | Display current username (read-only). | Username shown in read-only field | SettingsPage.tsx:141-178 | — |
| CC-REQ-SETTINGS-004 | Display email address (read-only). | Email shown in read-only field | SettingsPage.tsx:141-178 | — |
| CC-REQ-SETTINGS-005 | Display member since date (account creation date). | "Member since {date}" displayed | SettingsPage.tsx:141-178 | — |
| CC-REQ-SETTINGS-006 | Display total count of user's timelines. | Timeline count fetched and displayed | SettingsPage.tsx:141-178 | — |
| **Security Section** |
| CC-REQ-SETTINGS-007 | "Change Password" button opens Firebase password reset flow. | Button triggers sendPasswordResetEmail() | SettingsPage.tsx:57-70 | — |
| CC-REQ-SETTINGS-008 | "Sign Out of All Devices" functionality. | Button calls Firebase revoke tokens API | TBD | — |
| CC-REQ-SETTINGS-009 | Display last password change date if available from Firebase. | Date displayed if metadata.lastPasswordChange exists | TBD | — |
| **Preferences Section** |
| CC-REQ-SETTINGS-010 | Theme toggle between Dark and Light modes. | Toggle switches theme, updates DOM class | SettingsPage.tsx:217-233 | — |
| CC-REQ-SETTINGS-011 | Theme preference is persisted to localStorage. | localStorage.setItem("theme", value) on change | SettingsPage.tsx:217-233 | — |
| CC-REQ-SETTINGS-012 | Default timeline visibility selector (Public/Private) for new timelines. | Dropdown with options, updates user.defaultVisibility | TBD | — |
| CC-REQ-SETTINGS-013 | Default visibility preference is persisted to user profile in Firestore. | updateUserProfile({ defaultVisibility }) called on change | TBD | — |
| **Danger Zone** |
| CC-REQ-SETTINGS-014 | "Delete Account" button with visual danger styling. | Button styled with red/danger colors | SettingsPage.tsx:237-267 | — |
| CC-REQ-SETTINGS-015 | Account deletion requires confirmation dialog with explicit user consent. | Dialog appears with checkbox "I understand this is permanent" | TBD | — |
| CC-REQ-SETTINGS-016 | Account deletion requires re-authentication before proceeding. | reauthenticateWithCredential() called before deletion | TBD | — |
| CC-REQ-SETTINGS-017 | Account deletion removes user profile document from Firestore. | deleteDoc(users/{uid}) called | TBD | — |
| CC-REQ-SETTINGS-018 | Account deletion removes all timelines owned by the user. | Query timelines where ownerId=uid, delete all | TBD | — |
| CC-REQ-SETTINGS-019 | Account deletion removes user from Firebase Auth. | deleteUser(user) called after Firestore cleanup | TBD | — |
| CC-REQ-SETTINGS-020 | Danger Zone includes GDPR compliance notice. | Notice text visible in danger zone section | TBD | — |
| **Navigation** |
| CC-REQ-SETTINGS-021 | Back button returns user to previous page. | navigate(-1) on button click | SettingsPage.tsx | — |
| CC-REQ-SETTINGS-022 | Settings page is accessible from user menu in TopNavBar. | Menu item links to /settings route | SettingsPage.tsx | — |
| CC-REQ-SETTINGS-023 | Settings page uses consistent navigation structure with app layout. | TopNavBar rendered, consistent layout wrapper | SettingsPage.tsx | — |

## Test Coverage
| Requirement | Test File | Test Case |
|-------------|-----------|-----------|
| — | — | — |
