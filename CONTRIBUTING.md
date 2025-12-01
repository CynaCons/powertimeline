# Contributing to PowerTimeline

## Code Style Guidelines

### TypeScript Requirements

- **No `any` types**: Use proper TypeScript types. The ESLint rule `@typescript-eslint/no-explicit-any` is set to `error`.
- **Explicit return types**: Add return type annotations for functions, especially public APIs.
- **Prefer `const`**: Use `const` over `let` when variables are never reassigned.
- **No unused variables**: Clean up unused variables and imports.

### Code Quality Standards

- **Error handling**: Never use empty catch blocks. Always handle errors appropriately:
  ```typescript
  try {
    // risky operation
  } catch (error) {
    console.warn('Operation failed:', error);
    // handle gracefully
  }
  ```

- **Console usage**: Avoid `console.log` in production code. Use gated debug logging:
  ```typescript
  if (DEBUG_FLAG) {
    console.log('Debug info:', data);
  }
  ```

- **Function purity**: Prefer pure functions and avoid side effects where possible.

### React Guidelines

- **Hooks dependencies**: Follow the rules of hooks and exhaustive dependencies.
- **Component splitting**: Keep components focused and split large components into smaller ones.
- **Custom hooks**: Extract complex state logic into custom hooks.
- **Lazy loading**: Use `React.lazy()` for large components to improve bundle splitting.

### Import Organization

```typescript
// 1. React and core libraries
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { SomeLibrary } from 'some-library';

// 3. Internal imports (absolute paths preferred)
import { LayoutEngine } from './layout/LayoutEngine';
import type { Event } from './types';
```

## Development Workflow

### Before Committing

Pre-commit hooks will automatically run:
1. **ESLint** with auto-fixing for TypeScript files
2. **TypeScript** type checking
3. **Prettier** formatting for all supported files

### Manual Quality Checks

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type checking
npm run typecheck

# Build verification
npm run build

# Run tests
npm test
```

### Bundle Management

- Keep the main bundle under 400KB
- Use code splitting for large components
- Lazy load panels and overlays
- Monitor bundle size with `npm run build:analyze`

## Testing Standards

- Write tests for new features and bug fixes
- Ensure tests are deterministic and not flaky
- Use proper test selectors (`data-testid`)
- Include requirement traceability in tests:
  ```typescript
  test('feature works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-XXX' });
    // test implementation
  });
  ```

### Test Environment Setup

PowerTimeline uses Playwright for E2E testing with Firebase Authentication. Some tests require valid credentials.

#### Quick Setup

```bash
# 1. Copy the example environment file
cp .env.test.example .env.test

# 2. Edit .env.test with real credentials
#    - TEST_USER_EMAIL: A valid Firebase Auth account
#    - TEST_USER_PASSWORD: Password for that account
#    - TEST_USER_UID: Firebase Auth UID (find in Firebase Console)
#    - TEST_USER_TIMELINE_ID: A timeline ID owned by this user

# 3. Run tests
npm test                          # All tests
npx playwright test tests/home/   # Home page tests only
npx playwright test --ui          # Interactive UI mode
```

#### Test Categories

| Directory | Requires Auth | Description |
|-----------|---------------|-------------|
| `tests/production/` | No | Public smoke tests (run against powertimeline.com) |
| `tests/editor/` | Partial | Timeline editor tests |
| `tests/home/` | Yes | Home page and discovery tests |
| `tests/admin/` | Yes (admin role) | Admin panel tests |
| `tests/db/` | No | Firestore schema compliance |

#### Getting Test Credentials

1. **For contributors**: Ask a maintainer for dev environment credentials
2. **For maintainers**: Use Firebase Console to create a test user in the dev project (`powertimeline-dev`)

#### Troubleshooting

- **Tests timeout on auth**: Check `.env.test` has valid credentials
- **Admin tests fail**: Ensure test user has `role: 'admin'` in Firestore
- **"Missing credentials" warning**: Create `.env.test` from `.env.test.example`

## Architecture Guidelines

### Component Structure

```
src/
├── components/        # Reusable UI components
├── app/
│   ├── hooks/        # Custom hooks
│   ├── panels/       # Side panels
│   └── overlays/     # Modal overlays
├── layout/           # Layout engine and algorithms
├── timeline/         # Timeline-specific components
├── lib/              # Utilities and helpers
└── types.ts          # Global type definitions
```

### Performance Considerations

- Use React.memo for expensive components
- Implement proper virtualization for long lists
- Optimize re-renders with useMemo and useCallback
- Monitor performance with browser dev tools

## Git Workflow

1. Create feature branches from `main`
2. Make focused commits with clear messages
3. Pre-commit hooks will enforce code quality
4. Create pull requests with proper descriptions
5. Ensure CI passes before merging

## Error Handling Patterns

### Consistent Error Handling

```typescript
// ✅ Good
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.warn('Operation failed:', error);
  return fallbackValue;
}

// ❌ Bad
try {
  await riskyOperation();
} catch {}
```

### Debug Logging

```typescript
// ✅ Good
if (this.DEBUG_LAYOUT) {
  console.log('Layout calculation:', data);
}

// ❌ Bad
console.log('Debug info:', data);
```

## Documentation

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for technical changes
- Update PLAN.md to track progress
- Link code changes to requirements in SRS.md

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `TimelineCard.tsx`, `AuthoringOverlay.tsx` |
| Hooks | camelCase with `use` prefix | `useViewWindow.ts`, `useTimelineZoom.ts` |
| Utilities | camelCase | `timelineUtils.ts`, `yamlSerializer.ts` |
| Types | camelCase | `types.ts` |
| Test files | kebab-case with `.spec.ts` | `01-foundation.smoke.spec.ts` |
| SRS documents | SCREAMING_SNAKE_CASE | `SRS_HOME_PAGE.md`, `SRS_CARDS_SYSTEM.md` |

### Code Conventions

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `function TimelineCard()` |
| Hooks | camelCase with `use` prefix | `useViewWindow()` |
| Functions | camelCase | `calculatePosition()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_ZOOM_LEVEL` |
| Types/Interfaces | PascalCase | `interface TimelineEvent` |
| Enums | PascalCase | `enum CardType` |
| CSS classes | kebab-case or Tailwind | `timeline-card`, `bg-gray-900` |
| Test IDs | kebab-case | `data-testid="timeline-axis"` |

### Requirement IDs

Follow the pattern: `CC-REQ-{AREA}-{NUMBER}`

| Area | Prefix | Example |
|------|--------|---------|
| Foundation | `CC-REQ-FOUND-` | `CC-REQ-FOUND-001` |
| Layout | `CC-REQ-LAYOUT-` | `CC-REQ-LAYOUT-001` |
| Cards | `CC-REQ-CARD-` | `CC-REQ-CARD-FULL-001` |
| Degradation | `CC-REQ-DEGRADATION-` | `CC-REQ-DEGRADATION-001` |
| Zoom | `CC-REQ-ZOOM-` | `CC-REQ-ZOOM-001` |
| Minimap | `CC-REQ-MINIMAP-` | `CC-REQ-MINIMAP-001` |
| Admin | `CC-REQ-ADMIN-` | `CC-REQ-ADMIN-ACCESS-001` |

### Timeline & Firestore IDs

| Type | Convention | Example |
|------|------------|---------|
| Timeline IDs | `timeline-{slug}` | `timeline-french-revolution` |
| User IDs | Firebase Auth UID | `abc123xyz...` |
| Event IDs | Auto-generated | Firestore document ID |

### Version Numbers

Follow semantic versioning: `v{MAJOR}.{MINOR}.{PATCH}`

- **MAJOR**: Breaking changes (v1.0.0)
- **MINOR**: New features (v0.5.0)
- **PATCH**: Bug fixes (v0.5.1)

## Performance Targets

- Main bundle: < 400KB
- First load: < 3 seconds
- Test suite: < 2 minutes
- Memory usage: < 100MB for typical datasets

## Security Audit Checklist

Before releasing changes that affect authentication, authorization, or data access:

### Authentication (v0.5.7+)

- [ ] **Protected routes**: Verify `ProtectedRoute` wraps all sensitive pages
- [ ] **Auth state**: Check `useAuth()` hook is used correctly
- [ ] **Logout**: Ensure `signOutUser()` clears all session data
- [ ] **Token handling**: Never expose Firebase tokens in URLs or logs

### Firestore Security Rules

- [ ] **Read rules**: Public data uses `visibility` checks
- [ ] **Write rules**: All writes require `request.auth != null`
- [ ] **Owner checks**: Mutations verify `resource.data.ownerId == request.auth.uid`
- [ ] **Admin checks**: Admin-only operations use role verification
- [ ] **Collection groups**: Group queries respect visibility rules

### Data Exposure

- [ ] **API responses**: No private data in public API responses
- [ ] **Console logs**: No sensitive data in console output
- [ ] **Error messages**: Generic errors for auth failures (prevent enumeration)
- [ ] **URLs**: No sensitive IDs or tokens in shareable URLs

### Testing Security Changes

```bash
# Test as unauthenticated user
1. Open incognito window
2. Navigate to /browse - should work
3. Navigate to private timeline - should fail gracefully
4. Try to create timeline - should redirect to login

# Test as authenticated user
1. Sign in with test account
2. Verify "My Timelines" appears
3. Create a private timeline
4. Verify other users can't access it

# Test Firestore rules
firebase emulators:start
npm run test:firestore-rules
```

### Deployment Checklist

- [ ] **Rules deployed**: `firebase deploy --only firestore:rules`
- [ ] **Environment vars**: Verify `.env.production` settings
- [ ] **Feature flags**: Check `VITE_ENFORCE_AUTH=true` in production
- [ ] **Rollback plan**: Know how to revert if issues arise

### Common Vulnerabilities to Check

1. **Broken Access Control**: Can users access others' private data?
2. **Security Misconfiguration**: Are debug endpoints disabled?
3. **Injection**: Is user input sanitized before Firestore queries?
4. **IDOR**: Can users manipulate IDs to access unauthorized resources?

### Reporting Security Issues

For security vulnerabilities, please email: cynako@gmail.com

Do NOT create public issues for security vulnerabilities.