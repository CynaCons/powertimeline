# PowerTimeline Scripts

Utility scripts for development, testing, and data management.

## Firebase Admin Scripts

These scripts use Firebase Admin SDK and require service account credentials.

### User Management
- **`create-test-user.ts`** - Creates E2E test user with known credentials
  ```bash
  npx tsx scripts/create-test-user.ts
  ```

- **`list-firebase-users.ts`** - Lists all users in Firebase Auth
  ```bash
  npx tsx scripts/list-firebase-users.ts
  ```

### Data Management
- **`migrate-data-to-dev.ts`** - Migrates data from production to dev environment
  ```bash
  npx tsx scripts/migrate-data-to-dev.ts
  ```

### Testing & Debugging
- **`check-timeline-events.ts`** - Verifies timeline event data integrity
  ```bash
  npx tsx scripts/check-timeline-events.ts
  ```

- **`check-timeline-visibility.ts`** - Checks timeline visibility settings
  ```bash
  npx tsx scripts/check-timeline-visibility.ts
  ```

- **`test-events-client.ts`** - Tests event CRUD operations
  ```bash
  npx tsx scripts/test-events-client.ts
  ```

- **`test-firestore-client.ts`** - Tests Firestore client operations
  ```bash
  npx tsx scripts/test-firestore-client.ts
  ```

## Prerequisites

1. **Firebase Service Account Key**
   - Download from Firebase Console > Project Settings > Service Accounts
   - Save as `powertimeline-dev-firebase-adminsdk-*.json` (gitignored)
   - Path referenced in scripts

2. **Environment Variables**
   - `.env.local` should contain Firebase configuration
   - See `.env.test.example` for test credentials

## Security Notes

⚠️ **NEVER commit service account keys to version control**
- Service account keys are .gitignore'd
- Use environment variables for sensitive data
- Rotate keys if accidentally exposed

## Usage

All scripts use `tsx` for TypeScript execution:
```bash
npx tsx scripts/<script-name>.ts
```

Or add to package.json:
```json
{
  "scripts": {
    "script:create-test-user": "tsx scripts/create-test-user.ts",
    "script:list-users": "tsx scripts/list-firebase-users.ts"
  }
}
```
