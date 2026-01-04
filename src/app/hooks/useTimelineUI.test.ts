import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineUI } from './useTimelineUI';

describe('useTimelineUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useTimelineUI());

      expect(result.current.overlay).toBe(null);
      expect(result.current.streamViewerOpen).toBe(false);
      expect(result.current.commandPaletteOpen).toBe(false);
      expect(result.current.chatPanelOpen).toBe(false);
      expect(result.current.showInfoPanels).toBe(false);
    });

    it('respects initialStreamViewOpen option', () => {
      const { result } = renderHook(() =>
        useTimelineUI({ initialStreamViewOpen: true })
      );

      expect(result.current.streamViewerOpen).toBe(true);
    });
  });

  describe('overlay state', () => {
    it('setOverlay changes overlay type', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.setOverlay('editor');
      });
      expect(result.current.overlay).toBe('editor');

      act(() => {
        result.current.setOverlay('import-export');
      });
      expect(result.current.overlay).toBe('import-export');

      act(() => {
        result.current.setOverlay(null);
      });
      expect(result.current.overlay).toBe(null);
    });

    it('closeOverlay sets overlay to null', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.setOverlay('editor');
      });
      expect(result.current.overlay).toBe('editor');

      act(() => {
        result.current.closeOverlay();
      });
      expect(result.current.overlay).toBe(null);
    });

    it('openEditor sets overlay to editor', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.openEditor();
      });
      expect(result.current.overlay).toBe('editor');
    });

    it('openImportExport sets overlay to import-export', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.openImportExport();
      });
      expect(result.current.overlay).toBe('import-export');
    });

    it('toggleImportExport toggles import-export overlay', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.toggleImportExport();
      });
      expect(result.current.overlay).toBe('import-export');

      act(() => {
        result.current.toggleImportExport();
      });
      expect(result.current.overlay).toBe(null);
    });
  });

  describe('stream viewer', () => {
    it('openStreamView sets streamViewerOpen to true', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.openStreamView();
      });
      expect(result.current.streamViewerOpen).toBe(true);
    });

    it('closeStreamView sets streamViewerOpen to false', () => {
      const { result } = renderHook(() =>
        useTimelineUI({ initialStreamViewOpen: true })
      );

      act(() => {
        result.current.closeStreamView();
      });
      expect(result.current.streamViewerOpen).toBe(false);
    });

    it('toggleStreamView toggles state', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.toggleStreamView();
      });
      expect(result.current.streamViewerOpen).toBe(true);

      act(() => {
        result.current.toggleStreamView();
      });
      expect(result.current.streamViewerOpen).toBe(false);
    });

    it('calls onStreamViewChange when state changes', () => {
      const onStreamViewChange = vi.fn();
      const { result } = renderHook(() =>
        useTimelineUI({ onStreamViewChange })
      );

      act(() => {
        result.current.setStreamViewerOpen(true);
      });

      expect(onStreamViewChange).toHaveBeenCalledWith(true);
    });
  });

  describe('command palette', () => {
    it('openCommandPalette sets commandPaletteOpen to true', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.openCommandPalette();
      });
      expect(result.current.commandPaletteOpen).toBe(true);
    });

    it('closeCommandPalette sets commandPaletteOpen to false', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.setCommandPaletteOpen(true);
      });
      act(() => {
        result.current.closeCommandPalette();
      });
      expect(result.current.commandPaletteOpen).toBe(false);
    });
  });

  describe('chat panel', () => {
    it('toggleChatPanel toggles state', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.toggleChatPanel();
      });
      expect(result.current.chatPanelOpen).toBe(true);

      act(() => {
        result.current.toggleChatPanel();
      });
      expect(result.current.chatPanelOpen).toBe(false);
    });

    it('setChatPanelOpen accepts function updater', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.setChatPanelOpen((prev) => !prev);
      });
      expect(result.current.chatPanelOpen).toBe(true);
    });
  });

  describe('info panels', () => {
    it('toggleInfoPanels toggles state', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.toggleInfoPanels();
      });
      expect(result.current.showInfoPanels).toBe(true);

      act(() => {
        result.current.toggleInfoPanels();
      });
      expect(result.current.showInfoPanels).toBe(false);
    });
  });

  describe('escape key handling', () => {
    it('closes overlay on Escape key', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.setOverlay('editor');
      });
      expect(result.current.overlay).toBe('editor');

      // Simulate Escape key
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(event);
      });

      expect(result.current.overlay).toBe(null);
    });

    it('does not affect other state on Escape when no overlay', () => {
      const { result } = renderHook(() => useTimelineUI());

      act(() => {
        result.current.setStreamViewerOpen(true);
        result.current.setChatPanelOpen(true);
      });

      // Simulate Escape key
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(event);
      });

      // These should remain unchanged
      expect(result.current.streamViewerOpen).toBe(true);
      expect(result.current.chatPanelOpen).toBe(true);
    });
  });
});
