import { useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type OverlayType = null | 'editor' | 'import-export';

interface UseTimelineUIOptions {
  initialStreamViewOpen?: boolean;
  onStreamViewChange?: (isOpen: boolean) => void;
}

interface UseTimelineUIReturn {
  // Overlay state
  overlay: OverlayType;
  setOverlay: Dispatch<SetStateAction<OverlayType>>;
  closeOverlay: () => void;

  // Stream viewer
  streamViewerOpen: boolean;
  setStreamViewerOpen: Dispatch<SetStateAction<boolean>>;
  openStreamView: () => void;
  closeStreamView: () => void;
  toggleStreamView: () => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Chat panel
  chatPanelOpen: boolean;
  setChatPanelOpen: Dispatch<SetStateAction<boolean>>;
  toggleChatPanel: () => void;

  // Info panels
  showInfoPanels: boolean;
  setShowInfoPanels: Dispatch<SetStateAction<boolean>>;
  toggleInfoPanels: () => void;

  // Editor overlay helpers
  openEditor: () => void;
  openImportExport: () => void;
  toggleImportExport: () => void;
}

/**
 * Custom hook for managing timeline UI state (overlays and panels).
 *
 * Handles:
 * - Editor overlay (authoring form)
 * - Import/Export overlay
 * - Stream viewer modal
 * - Command palette
 * - Chat panel
 * - Info panels toggle
 * - Escape key to close overlays
 */
export function useTimelineUI({
  initialStreamViewOpen = false,
  onStreamViewChange,
}: UseTimelineUIOptions = {}): UseTimelineUIReturn {
  // Overlay state (editor, import-export, or null)
  const [overlay, setOverlay] = useState<OverlayType>(null);

  // Stream viewer modal
  const [streamViewerOpen, setStreamViewerOpen] = useState(initialStreamViewOpen);

  // Command palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Chat panel
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  // Info panels visibility
  const [showInfoPanels, setShowInfoPanels] = useState(false);

  // Respond to external trigger to open stream view (e.g., from MobileNotice)
  useEffect(() => {
    if (initialStreamViewOpen) {
      setStreamViewerOpen(true);
    }
  }, [initialStreamViewOpen]);

  // Notify parent when stream view state changes
  useEffect(() => {
    onStreamViewChange?.(streamViewerOpen);
  }, [streamViewerOpen, onStreamViewChange]);

  // Escape key to close overlays
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && overlay) {
        setOverlay(null);
      }
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [overlay]);

  // Overlay actions
  const closeOverlay = useCallback(() => setOverlay(null), []);
  const openEditor = useCallback(() => setOverlay('editor'), []);
  const openImportExport = useCallback(() => setOverlay('import-export'), []);
  const toggleImportExport = useCallback(
    () => setOverlay(overlay === 'import-export' ? null : 'import-export'),
    [overlay]
  );

  // Stream view actions
  const openStreamView = useCallback(() => setStreamViewerOpen(true), []);
  const closeStreamView = useCallback(() => setStreamViewerOpen(false), []);
  const toggleStreamView = useCallback(
    () => setStreamViewerOpen((prev) => !prev),
    []
  );

  // Command palette actions
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  // Chat panel actions
  const toggleChatPanel = useCallback(
    () => setChatPanelOpen((prev) => !prev),
    []
  );

  // Info panels actions
  const toggleInfoPanels = useCallback(
    () => setShowInfoPanels((prev) => !prev),
    []
  );

  return {
    // Overlay
    overlay,
    setOverlay,
    closeOverlay,

    // Stream viewer
    streamViewerOpen,
    setStreamViewerOpen,
    openStreamView,
    closeStreamView,
    toggleStreamView,

    // Command palette
    commandPaletteOpen,
    setCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,

    // Chat panel
    chatPanelOpen,
    setChatPanelOpen,
    toggleChatPanel,

    // Info panels
    showInfoPanels,
    setShowInfoPanels,
    toggleInfoPanels,

    // Editor helpers
    openEditor,
    openImportExport,
    toggleImportExport,
  };
}
