import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Event } from '../../types';

interface UseEventEditFormOptions {
  selectedEvent: Event | undefined;
  selectedId: string | undefined;
}

interface UseEventEditFormReturn {
  // Form state
  editDate: string;
  editTime: string;
  editTitle: string;
  editDescription: string;

  // Setters
  setEditDate: (value: string) => void;
  setEditTime: (value: string) => void;
  setEditTitle: (value: string) => void;
  setEditDescription: (value: string) => void;

  // Helpers
  resetForm: () => void;
  isDirty: boolean;

  // Get form values as object (for save operations)
  getFormValues: () => { date: string; time: string; title: string; description: string };
}

/**
 * Custom hook for managing event edit form state.
 *
 * Syncs form fields when the selected event changes.
 * IMPORTANT: Only depends on selectedId, NOT on selectedEvent object,
 * to prevent form fields resetting when events array changes.
 */
export function useEventEditForm({
  selectedEvent,
  selectedId,
}: UseEventEditFormOptions): UseEventEditFormReturn {
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Track original values for dirty detection
  const [originalValues, setOriginalValues] = useState<{
    date: string;
    time: string;
    title: string;
    description: string;
  } | null>(null);

  // Sync edit fields when selection changes
  // IMPORTANT: Only depend on selectedId, NOT on 'selectedEvent' object
  // If 'selectedEvent' is in deps, form fields reset whenever events array changes
  // (because selectedEvent reference changes), causing user to lose their edits
  useEffect(() => {
    if (selectedEvent) {
      const values = {
        date: selectedEvent.date,
        time: selectedEvent.time ?? '',
        title: selectedEvent.title,
        description: selectedEvent.description ?? '',
      };
      setEditDate(values.date);
      setEditTime(values.time);
      setEditTitle(values.title);
      setEditDescription(values.description);
      setOriginalValues(values);
    } else {
      setEditDate('');
      setEditTime('');
      setEditTitle('');
      setEditDescription('');
      setOriginalValues(null);
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset form to empty state
  const resetForm = useCallback(() => {
    setEditDate('');
    setEditTime('');
    setEditTitle('');
    setEditDescription('');
    setOriginalValues(null);
  }, []);

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!originalValues) {
      // New event - dirty if any field has content
      return editDate !== '' || editTime !== '' || editTitle !== '' || editDescription !== '';
    }
    // Existing event - dirty if any field differs from original
    return (
      editDate !== originalValues.date ||
      editTime !== originalValues.time ||
      editTitle !== originalValues.title ||
      editDescription !== originalValues.description
    );
  }, [editDate, editTime, editTitle, editDescription, originalValues]);

  // Get current form values as object
  const getFormValues = useCallback(() => ({
    date: editDate,
    time: editTime,
    title: editTitle,
    description: editDescription,
  }), [editDate, editTime, editTitle, editDescription]);

  return {
    editDate,
    editTime,
    editTitle,
    editDescription,
    setEditDate,
    setEditTime,
    setEditTitle,
    setEditDescription,
    resetForm,
    isDirty,
    getFormValues,
  };
}
