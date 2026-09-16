import { describe, expect, it } from 'vitest';
import { toDate, toIsoString, toLastmodDate } from './timestamps';

describe('toDate / toLastmodDate', () => {
  it('parses ISO strings', () => {
    expect(toLastmodDate('2024-07-14T12:00:00.000Z')).toBe('2024-07-14');
  });

  it('parses Date objects', () => {
    expect(toLastmodDate(new Date('2024-01-02T00:00:00.000Z'))).toBe('2024-01-02');
  });

  it('parses Firestore Timestamp-like toDate()', () => {
    const timestamp = {
      toDate: () => new Date('2023-12-01T05:00:00.000Z'),
    };
    expect(toLastmodDate(timestamp)).toBe('2023-12-01');
  });

  it('parses Firestore Timestamp-like seconds', () => {
    const timestamp = { seconds: 1700000000, nanoseconds: 0 };
    expect(toLastmodDate(timestamp)).toBe(toDate(timestamp)?.toISOString().slice(0, 10));
    expect(toIsoString(timestamp)).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it('parses _seconds from serialized timestamps', () => {
    expect(toLastmodDate({ _seconds: 1700000000, _nanoseconds: 0 })).toBe(
      new Date(1700000000 * 1000).toISOString().slice(0, 10)
    );
  });

  it('does not throw on invalid values', () => {
    expect(toLastmodDate('not-a-date')).toBeUndefined();
    expect(toLastmodDate({})).toBeUndefined();
    expect(toLastmodDate(null)).toBeUndefined();
    expect(toLastmodDate(undefined)).toBeUndefined();
    expect(toLastmodDate({ toDate: () => { throw new Error('boom'); } })).toBeUndefined();
    expect(() => new Date({} as unknown as string).toISOString()).toThrow();
  });
});
