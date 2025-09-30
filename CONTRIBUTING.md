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

## Performance Targets

- Main bundle: < 400KB
- First load: < 3 seconds
- Test suite: < 2 minutes
- Memory usage: < 100MB for typical datasets