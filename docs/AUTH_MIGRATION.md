# Authentication Migration Guide

## Overview

Starting with v0.5.7, PowerTimeline enforces Firebase Authentication in production. This document explains the authentication model and how to migrate existing users.

## Authentication Model

### Public Access (No Authentication Required)
- **Landing page** (`/`) - Always accessible
- **Browse page** (`/browse`) - View public timelines
- **Timeline viewing** - View public and unlisted timelines
- **Search** - Search public timelines

### Protected Access (Authentication Required)
- **User profile page** (`/user/:id`) - Only your own profile when editing
- **Timeline editing** - Only the owner can edit their timelines
- **Timeline creation** - Requires authentication
- **Admin features** - Requires admin role

## Environment Configuration

The `VITE_ENFORCE_AUTH` flag controls authentication enforcement:

```env
# .env.production
VITE_ENFORCE_AUTH=true   # Enforce authentication (default in production)

# .env.local (development)
VITE_ENFORCE_AUTH=false  # Disable for local development
```

## Firestore Security Rules

### Timeline Visibility Levels

| Visibility | Who Can View | Who Can Edit |
|------------|--------------|--------------|
| `public`   | Anyone       | Owner only   |
| `unlisted` | Anyone with link | Owner only |
| `private`  | Owner only   | Owner only   |

### Key Security Rules (v0.5.7)

1. **Timeline reads**: Respects visibility setting
2. **Event reads**: Inherits from parent timeline visibility
3. **Timeline creation**: Requires authentication, owner must match auth UID
4. **Timeline editing**: Owner only
5. **View count updates**: Anyone (for analytics)

## Migration Steps for Existing Users

### For Users with Local Data

If you have timelines stored locally (pre-v0.5.0), they need to be migrated to Firestore:

1. **Sign in** with Google or email
2. **Your local timelines** will be automatically associated with your account
3. **Verify** your timelines appear in "My Timelines" on `/browse`

### For New Users

1. **Browse** public timelines without signing in
2. **Sign in** when you want to:
   - Create your own timelines
   - Fork existing timelines
   - Edit your profile

## Troubleshooting

### "Missing or insufficient permissions" Error

This usually means:
- Trying to read a private timeline without authentication
- Trying to edit a timeline you don't own
- Firestore rules are outdated

**Solution**: Sign in with the account that owns the timeline, or ensure the timeline is public.

### Can't See "My Timelines"

The "My Timelines" section only appears when:
- You are signed in
- You have created at least one timeline

### Timeline Not Appearing After Creation

1. Refresh the page
2. Check browser console for errors
3. Verify you're signed in with the correct account

## Security Best Practices

1. **Never share** your Firebase credentials
2. **Use strong passwords** for email authentication
3. **Sign out** when using shared computers
4. **Set timeline visibility** appropriately:
   - `private` for personal/draft timelines
   - `unlisted` for sharing with specific people
   - `public` for community timelines

## Technical Details

### Protected Routes

The following routes require authentication when `VITE_ENFORCE_AUTH=true`:

```typescript
// src/main.tsx
<Route path="/user/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
```

### ProtectedRoute Behavior

```typescript
// When VITE_ENFORCE_AUTH=true:
// - If not authenticated: Redirect to /login
// - If authenticated: Render children

// When VITE_ENFORCE_AUTH=false:
// - Always render children (for development)
```

## Contact

For authentication issues, contact: cynako@gmail.com
