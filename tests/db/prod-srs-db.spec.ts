/**
 * Firestore SRS compliance checks - Production environment
 * Read-only validations against powertimeline-860f1 project.
 * WARNING: Read-only; do not modify data.
 */

import { test, expect } from '@playwright/test';
import { initFirestore } from '../utils/dbAdmin';

const db = initFirestore('prod');

const RESERVED_USERNAMES = new Set([
  'admin','administrator','api','app','auth','browse','config','dashboard','edit','editor','help','home','login','logout','new','null','profile','register','search','settings','signup','support','system','test','timeline','timelines','undefined','user','users','view','www'
]);

const ALLOWED_USER_FIELDS = new Set(['id','email','username','createdAt','role']);
const ALLOWED_TIMELINE_FIELDS = new Set(['id','title','description','ownerId','createdAt','updatedAt','viewCount','featured','visibility','eventCount']);
const ALLOWED_EVENT_FIELDS = new Set(['id','title','description','date','endDate','time','timelineId','createdAt','updatedAt']);
const ALLOWED_LOG_FIELDS = new Set(['id','timestamp','adminUserId','adminUserName','action','targetType','targetId','targetName','details','metadata']);
const ALLOWED_ROLES = new Set(['user','admin']);
const ADMIN_EMAIL_ALLOWLIST = new Set(['cynako@gmail.com','test@powertimeline.com']);
const ALLOWED_VISIBILITY = new Set(['public','unlisted','private']);
const LOG_ACTIONS = new Set(['USER_ROLE_CHANGE','USER_DELETE','TIMELINE_DELETE','BULK_OPERATION','CONFIG_CHANGE']);
const LOG_TARGET_TYPES = new Set(['user','timeline','system']);

test.describe('Prod Firestore - SRS DB compliance (read-only)', () => {
  test('users: uniqueness, roles, reserved, fields', async () => {
    const snap = await db.collection('users').get();
    const usernames = new Set<string>();
    const emails = new Set<string>();
    const admins: string[] = [];

    snap.forEach((doc) => {
      const data = doc.data();
      const keys = Object.keys(data);
      expect(keys.every((k) => ALLOWED_USER_FIELDS.has(k))).toBe(true);

      expect(data.id).toBe(doc.id);
      expect(typeof data.email).toBe('string');
      expect(typeof data.username).toBe('string');
      expect(typeof data.createdAt).toBe('string');

      expect(data.username).toMatch(/^[a-z][a-z0-9-]{2,19}$/);
      expect(data.username.endsWith('-')).toBe(false);
      expect(RESERVED_USERNAMES.has(data.username)).toBe(false);
      expect(usernames.has(data.username)).toBe(false);
      usernames.add(data.username);

      expect(emails.has(data.email)).toBe(false);
      emails.add(data.email);

      if (data.role) {
        expect(ALLOWED_ROLES.has(data.role)).toBe(true);
        if (data.role === 'admin') {
          admins.push(data.email);
        }
      }
    });

    admins.forEach((email) => expect(ADMIN_EMAIL_ALLOWLIST.has(email)).toBe(true));
  });

  test('timelines: fields, owner matches path, visibility, counts', async () => {
    const snap = await db.collectionGroup('timelines').get();
    snap.forEach((doc) => {
      const data = doc.data();
      const keys = Object.keys(data);
      expect(keys.every((k) => ALLOWED_TIMELINE_FIELDS.has(k))).toBe(true);
      expect(data.id).toBe(doc.id);

      // owner from parent path
      const segments = doc.ref.path.split('/');
      const parentUserId = segments[1];
      expect(data.ownerId).toBe(parentUserId);
      expect(ALLOWED_VISIBILITY.has(data.visibility)).toBe(true);
      expect(data.viewCount).toBeGreaterThanOrEqual(0);
      if (data.eventCount !== undefined) {
        expect(data.eventCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test('events: fields, timeline linkage', async () => {
    const snap = await db.collectionGroup('events').get();
    snap.forEach((doc) => {
      const data = doc.data();
      const keys = Object.keys(data);
      expect(keys.every((k) => ALLOWED_EVENT_FIELDS.has(k))).toBe(true);
      expect(data.id).toBe(doc.id);

      const parts = doc.ref.path.split('/');
      const timelineIdFromPath = parts[3];
      expect(data.timelineId).toBe(timelineIdFromPath);
      expect(typeof data.date).toBe('string');
    });
  });

  test('activity logs: fields, enums, admin linkage', async () => {
    const snap = await db.collection('activityLogs').get();
    snap.forEach((doc) => {
      const data = doc.data();
      const keys = Object.keys(data);
      expect(keys.every((k) => ALLOWED_LOG_FIELDS.has(k))).toBe(true);
      expect(data.id).toBe(doc.id);
      expect(LOG_ACTIONS.has(data.action)).toBe(true);
      expect(LOG_TARGET_TYPES.has(data.targetType)).toBe(true);
      expect(typeof data.adminUserId).toBe('string');
    });
  });
});
