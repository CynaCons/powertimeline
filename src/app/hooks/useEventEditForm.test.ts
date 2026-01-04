import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventEditForm } from './useEventEditForm';
import type { Event } from '../../types';

const mockEvent: Event = {
  id: 'event-1',
  date: '1963-11-22',
  time: '12:30',
  title: 'Test Event',
  description: 'Test description',
};

const mockEventNoOptionals: Event = {
  id: 'event-2',
  date: '1963-06-05',
  title: 'Minimal Event',
};

describe('useEventEditForm', () => {
  describe('initialization', () => {
    it('initializes with empty values when no event selected', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: undefined, selectedId: undefined })
      );

      expect(result.current.editDate).toBe('');
      expect(result.current.editTime).toBe('');
      expect(result.current.editTitle).toBe('');
      expect(result.current.editDescription).toBe('');
    });

    it('initializes with event values when event is selected', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      expect(result.current.editDate).toBe('1963-11-22');
      expect(result.current.editTime).toBe('12:30');
      expect(result.current.editTitle).toBe('Test Event');
      expect(result.current.editDescription).toBe('Test description');
    });

    it('handles event with undefined optional fields', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEventNoOptionals, selectedId: mockEventNoOptionals.id })
      );

      expect(result.current.editDate).toBe('1963-06-05');
      expect(result.current.editTime).toBe('');
      expect(result.current.editTitle).toBe('Minimal Event');
      expect(result.current.editDescription).toBe('');
    });
  });

  describe('setters', () => {
    it('updates editDate when setEditDate is called', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.setEditDate('2000-01-01');
      });

      expect(result.current.editDate).toBe('2000-01-01');
    });

    it('updates editTime when setEditTime is called', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.setEditTime('14:00');
      });

      expect(result.current.editTime).toBe('14:00');
    });

    it('updates editTitle when setEditTitle is called', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.setEditTitle('New Title');
      });

      expect(result.current.editTitle).toBe('New Title');
    });

    it('updates editDescription when setEditDescription is called', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.setEditDescription('New description');
      });

      expect(result.current.editDescription).toBe('New description');
    });
  });

  describe('isDirty', () => {
    it('returns false when form matches original event', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      expect(result.current.isDirty).toBe(false);
    });

    it('returns true when date is modified', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.setEditDate('2000-01-01');
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('returns true when title is modified', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.setEditTitle('Modified');
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('returns false when no event selected and form is empty', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: undefined, selectedId: undefined })
      );

      expect(result.current.isDirty).toBe(false);
    });

    it('returns true when no event selected but form has content (new event)', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: undefined, selectedId: undefined })
      );

      act(() => {
        result.current.setEditTitle('New Event');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('resetForm', () => {
    it('clears all form fields', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.editDate).toBe('');
      expect(result.current.editTime).toBe('');
      expect(result.current.editTitle).toBe('');
      expect(result.current.editDescription).toBe('');
    });
  });

  describe('getFormValues', () => {
    it('returns current form values as object', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      const values = result.current.getFormValues();

      expect(values).toEqual({
        date: '1963-11-22',
        time: '12:30',
        title: 'Test Event',
        description: 'Test description',
      });
    });

    it('returns modified values after edits', () => {
      const { result } = renderHook(() =>
        useEventEditForm({ selectedEvent: mockEvent, selectedId: mockEvent.id })
      );

      act(() => {
        result.current.setEditTitle('Modified Title');
        result.current.setEditTime('15:00');
      });

      const values = result.current.getFormValues();

      expect(values).toEqual({
        date: '1963-11-22',
        time: '15:00',
        title: 'Modified Title',
        description: 'Test description',
      });
    });
  });

  describe('selection changes', () => {
    it('syncs form when selectedId changes', () => {
      const { result, rerender } = renderHook(
        ({ selectedEvent, selectedId }) =>
          useEventEditForm({ selectedEvent, selectedId }),
        {
          initialProps: {
            selectedEvent: mockEvent,
            selectedId: mockEvent.id,
          },
        }
      );

      // Initial state
      expect(result.current.editTitle).toBe('Test Event');

      // Change selection
      rerender({
        selectedEvent: mockEventNoOptionals,
        selectedId: mockEventNoOptionals.id,
      });

      expect(result.current.editTitle).toBe('Minimal Event');
      expect(result.current.editDate).toBe('1963-06-05');
    });

    it('clears form when selection is cleared', () => {
      const { result, rerender } = renderHook(
        ({ selectedEvent, selectedId }: { selectedEvent: Event | undefined; selectedId: string | undefined }) =>
          useEventEditForm({ selectedEvent, selectedId }),
        {
          initialProps: {
            selectedEvent: mockEvent as Event | undefined,
            selectedId: mockEvent.id as string | undefined,
          },
        }
      );

      // Initial state
      expect(result.current.editTitle).toBe('Test Event');

      // Clear selection
      rerender({
        selectedEvent: undefined,
        selectedId: undefined,
      });

      expect(result.current.editTitle).toBe('');
      expect(result.current.editDate).toBe('');
    });

    it('does NOT reset form when only selectedEvent reference changes (same id)', () => {
      const { result, rerender } = renderHook(
        ({ selectedEvent, selectedId }) =>
          useEventEditForm({ selectedEvent, selectedId }),
        {
          initialProps: {
            selectedEvent: mockEvent,
            selectedId: mockEvent.id,
          },
        }
      );

      // Modify form
      act(() => {
        result.current.setEditTitle('User edited title');
      });

      expect(result.current.editTitle).toBe('User edited title');

      // Rerender with new object reference but same ID
      const newEventReference: Event = { ...mockEvent };
      rerender({
        selectedEvent: newEventReference,
        selectedId: mockEvent.id,
      });

      // Form should NOT be reset - this is the key behavior!
      expect(result.current.editTitle).toBe('User edited title');
    });
  });
});
