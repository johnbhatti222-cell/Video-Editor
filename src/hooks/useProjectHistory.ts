import { useState, useCallback, useEffect, useRef } from "react";
import { ImageClip, ProjectSettings, AudioTrack } from "../types";

export interface ProjectSnapshot {
  clips: ImageClip[];
  settings: ProjectSettings;
  audioTrack: AudioTrack;
  actionName?: string;
}

interface UseProjectHistoryOptions {
  maxHistory?: number;
}

export function useProjectHistory(
  initialClips: ImageClip[],
  initialSettings: ProjectSettings,
  initialAudioTrack: AudioTrack,
  options: UseProjectHistoryOptions = {}
) {
  const maxHistory = options.maxHistory || 40;

  const [present, setPresent] = useState<ProjectSnapshot>({
    clips: initialClips,
    settings: initialSettings,
    audioTrack: initialAudioTrack,
    actionName: "Initial Project",
  });

  const [past, setPast] = useState<ProjectSnapshot[]>([]);
  const [future, setFuture] = useState<ProjectSnapshot[]>([]);

  // Ref to track latest present state for asynchronous or callback access
  const presentRef = useRef(present);
  presentRef.current = present;

  // Debounce helper for slider drags (e.g. brightness, zoom slider, duration)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSnapshotRef = useRef<ProjectSnapshot | null>(null);

  /**
   * Commit a new snapshot to history
   */
  const pushSnapshot = useCallback(
    (newSnapshot: ProjectSnapshot, isDebounced: boolean = false) => {
      if (isDebounced) {
        pendingSnapshotRef.current = newSnapshot;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          if (pendingSnapshotRef.current) {
            const current = presentRef.current;
            setPast((prevPast) => {
              const nextPast = [...prevPast, current];
              if (nextPast.length > maxHistory) {
                return nextPast.slice(nextPast.length - maxHistory);
              }
              return nextPast;
            });
            setPresent(pendingSnapshotRef.current);
            setFuture([]);
            pendingSnapshotRef.current = null;
          }
        }, 300);
      } else {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
          pendingSnapshotRef.current = null;
        }
        const current = presentRef.current;
        setPast((prevPast) => {
          const nextPast = [...prevPast, current];
          if (nextPast.length > maxHistory) {
            return nextPast.slice(nextPast.length - maxHistory);
          }
          return nextPast;
        });
        setPresent(newSnapshot);
        setFuture([]);
      }
    },
    [maxHistory]
  );

  /**
   * Update clips with history
   */
  const updateClips = useCallback(
    (updater: ImageClip[] | ((prev: ImageClip[]) => ImageClip[]), actionName?: string, isDebounced: boolean = false) => {
      const nextClips = typeof updater === "function" ? updater(presentRef.current.clips) : updater;
      pushSnapshot(
        {
          clips: nextClips,
          settings: presentRef.current.settings,
          audioTrack: presentRef.current.audioTrack,
          actionName: actionName || "Edit Scene",
        },
        isDebounced
      );
    },
    [pushSnapshot]
  );

  /**
   * Update settings with history
   */
  const updateSettings = useCallback(
    (updates: Partial<ProjectSettings>, actionName?: string) => {
      const nextSettings = { ...presentRef.current.settings, ...updates };
      pushSnapshot({
        clips: presentRef.current.clips,
        settings: nextSettings,
        audioTrack: presentRef.current.audioTrack,
        actionName: actionName || "Update Settings",
      });
    },
    [pushSnapshot]
  );

  /**
   * Update audio track with history
   */
  const updateAudioTrack = useCallback(
    (updates: Partial<AudioTrack>, actionName?: string) => {
      const nextAudio = { ...presentRef.current.audioTrack, ...updates };
      pushSnapshot({
        clips: presentRef.current.clips,
        settings: presentRef.current.settings,
        audioTrack: nextAudio,
        actionName: actionName || "Update Audio Track",
      });
    },
    [pushSnapshot]
  );

  /**
   * Reset the entire state and clear history (e.g. on loading a template or new project)
   */
  const resetProject = useCallback(
    (clips: ImageClip[], settings: ProjectSettings, audioTrack: AudioTrack, actionName: string = "Load Template") => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setPast([]);
      setFuture([]);
      setPresent({
        clips,
        settings,
        audioTrack,
        actionName,
      });
    },
    []
  );

  /**
   * Batch update state with history entry (e.g. AI Director applied)
   */
  const batchUpdateProject = useCallback(
    (clips: ImageClip[], settings?: ProjectSettings, audioTrack?: AudioTrack, actionName: string = "AI Director") => {
      pushSnapshot({
        clips,
        settings: settings || presentRef.current.settings,
        audioTrack: audioTrack || presentRef.current.audioTrack,
        actionName,
      });
    },
    [pushSnapshot]
  );

  /**
   * Undo operation
   */
  const undo = useCallback(() => {
    if (past.length === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prevFuture) => [presentRef.current, ...prevFuture]);
    setPresent(previous);
  }, [past]);

  /**
   * Redo operation
   */
  const redo = useCallback(() => {
    if (future.length === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, presentRef.current]);
    setFuture(newFuture);
    setPresent(next);
  }, [future]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Global Keyboard Shortcuts (Cmd+Z / Ctrl+Z, Cmd+Shift+Z / Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger undo/redo if typing inside text input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl) {
        // Redo: Cmd+Shift+Z or Ctrl+Shift+Z or Ctrl+Y
        if ((e.shiftKey && e.key.toLowerCase() === "z") || (!isMac && e.key.toLowerCase() === "y")) {
          e.preventDefault();
          redo();
        }
        // Undo: Cmd+Z or Ctrl+Z
        else if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    clips: present.clips,
    settings: present.settings,
    audioTrack: present.audioTrack,
    updateClips,
    updateSettings,
    updateAudioTrack,
    resetProject,
    batchUpdateProject,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount: past.length,
    futureCount: future.length,
    lastAction: past.length > 0 ? past[past.length - 1].actionName : undefined,
    nextAction: future.length > 0 ? future[0].actionName : undefined,
  };
}
