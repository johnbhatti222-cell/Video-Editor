import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { VideoPlayer } from "./components/VideoPlayer";
import { Timeline } from "./components/Timeline";
import { Inspector } from "./components/Inspector";
import { ExportModal } from "./components/ExportModal";
import { AIDirectorModal } from "./components/AIDirectorModal";
import {
  ImageClip,
  ProjectSettings,
  AudioTrack,
} from "./types";
import { SAMPLE_PROJECTS, createBlankProject } from "./data/sampleProjects";
import { globalRenderEngine } from "./utils/renderEngine";
import { globalAudioEngine } from "./utils/audioEngine";
import { useProjectHistory } from "./hooks/useProjectHistory";

export function App() {
  // Initialize with the Alps Wanderlust project
  const initialProject = SAMPLE_PROJECTS[0];

  const {
    clips,
    settings,
    audioTrack,
    updateClips,
    updateSettings,
    updateAudioTrack,
    resetProject,
    batchUpdateProject,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount,
    futureCount,
    lastAction,
  } = useProjectHistory(
    initialProject.clips,
    initialProject.settings,
    initialProject.audioTrack
  );

  const [selectedClipIndex, setSelectedClipIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAIDirectorModalOpen, setIsAIDirectorModalOpen] = useState<boolean>(false);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const totalDuration = globalRenderEngine.getTotalDuration(clips);

  // Preload initial clips
  useEffect(() => {
    globalRenderEngine.preloadImages(clips);
  }, []);

  // Update settings handler
  const handleUpdateSettings = (updates: Partial<ProjectSettings>) => {
    updateSettings(updates, "Update Project Settings");
  };

  // Update audio track handler
  const handleUpdateAudioTrack = (updates: Partial<AudioTrack>) => {
    updateAudioTrack(updates, "Update Audio Track");
  };

  // Update specific clip handler
  const handleUpdateClip = (index: number, updates: Partial<ImageClip>) => {
    updateClips((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], ...updates };
      }
      return next;
    }, `Edit ${clips[index]?.name || "Scene"}`);
  };

  // Reorder clips in timeline
  const handleReorderClips = (fromIndex: number, toIndex: number) => {
    updateClips((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    }, "Reorder Scenes");
    setSelectedClipIndex(toIndex);
  };

  // Delete clip
  const handleDeleteClip = (index: number) => {
    if (clips.length <= 1) return;
    updateClips((prev) => prev.filter((_, i) => i !== index), "Delete Scene");
    setSelectedClipIndex((prev) => Math.max(0, Math.min(prev, clips.length - 2)));
  };

  // Duplicate clip
  const handleDuplicateClip = (index: number) => {
    const original = clips[index];
    if (!original) return;
    const duplicated: ImageClip = {
      ...JSON.parse(JSON.stringify(original)),
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${original.name} (Copy)`,
    };
    updateClips((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    }, "Duplicate Scene");
    setSelectedClipIndex(index + 1);
  };

  // Add new photos via upload / drag & drop
  const handleAddImages = (fileList: FileList) => {
    const newClips: ImageClip[] = [];
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));

    files.forEach((file, i) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, "");
      const motions: ImageClip["motion"]["type"][] = [
        "zoom-in",
        "zoom-out",
        "pan-right",
        "pan-left",
        "tilt-3d",
        "orbit-cw",
      ];
      const randomMotion = motions[i % motions.length];

      newClips.push({
        id: `user-clip-${Date.now()}-${i}`,
        name,
        imageUrl: url,
        duration: 4.0,
        motion: {
          type: randomMotion,
          intensity: 1.15,
          easing: "ease-in-out",
          focusX: 0.5,
          focusY: 0.5,
        },
        transition: {
          type: "crossfade",
          duration: 0.8,
        },
        filter: "none",
        particleFx: "none",
        vignette: true,
        filmGrain: 0.05,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        textOverlays: [],
      });
    });

    if (newClips.length > 0) {
      updateClips((prev) => [...prev, ...newClips], `Add ${newClips.length} Photos`);
      globalRenderEngine.preloadImages(newClips);
    }
  };

  // Load sample project
  const handleLoadSampleProject = (projectId: string) => {
    const found = SAMPLE_PROJECTS.find((p) => p.id === projectId);
    if (found) {
      resetProject(found.clips, found.settings, found.audioTrack, `Load ${found.name}`);
      setSelectedClipIndex(0);
      setCurrentTime(0);
      globalRenderEngine.preloadImages(found.clips);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddImages(e.dataTransfer.files);
    }
  };

  // Single scene AI direct
  const handleAIDirectSingleScene = async (clipIdx: number) => {
    const targetClip = clips[clipIdx];
    if (!targetClip) return;

    setIsAILoading(true);
    try {
      const res = await fetch("/api/ai/direct-motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips: [{ id: targetClip.id, name: targetClip.name, index: 0, currentMotion: targetClip.motion.type }],
          theme: "Cinematic High Emotion",
          aspectRatio: settings.aspectRatio,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const dir = data.directions?.[0];
        if (dir) {
          handleUpdateClip(clipIdx, {
            duration: dir.duration || targetClip.duration,
            motion: {
              ...targetClip.motion,
              type: dir.motionType || targetClip.motion.type,
              intensity: dir.intensity || targetClip.motion.intensity,
              easing: dir.easing || targetClip.motion.easing,
              focusX: dir.focusX !== undefined ? dir.focusX : targetClip.motion.focusX,
              focusY: dir.focusY !== undefined ? dir.focusY : targetClip.motion.focusY,
            },
            transition: {
              ...targetClip.transition,
              type: dir.transitionType || targetClip.transition.type,
              duration: dir.transitionDuration || targetClip.transition.duration,
            },
            filter: dir.filter || targetClip.filter,
            particleFx: dir.particleFx || targetClip.particleFx,
            textOverlays: targetClip.textOverlays,
          });
        }
      }
    } catch (e) {
      console.error("AI Scene Direct error:", e);
    } finally {
      setIsAILoading(false);
    }
  };

  // Clear all text overlays across all scenes
  const handleClearAllTextOverlays = () => {
    updateClips(
      (prev) =>
        prev.map((clip) => ({
          ...clip,
          textOverlays: [],
        })),
      "Clear All Text Overlays"
    );
  };

  // Full storyboard AI directing result
  const handleApplyDirecting = (
    updatedClips: ImageClip[],
    suggestedAudio?: Partial<AudioTrack>
  ) => {
    batchUpdateProject(
      updatedClips,
      settings,
      suggestedAudio ? { ...audioTrack, ...suggestedAudio } : audioTrack,
      "AI Storyboard Direction"
    );
    globalRenderEngine.preloadImages(updatedClips);
  };

  const selectedClip = clips[selectedClipIndex] || clips[0] || null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-neutral-950 text-white select-none overflow-hidden"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-indigo-950/85 backdrop-blur-md border-4 border-dashed border-indigo-400 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-150">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/50 flex items-center justify-center mb-4 shadow-2xl shadow-indigo-500/50">
            <span className="text-4xl">📸</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Drop Photos Here</h3>
          <p className="text-sm text-indigo-200">
            Instantly import and convert your photos into animated cinematic video scenes
          </p>
        </div>
      )}

      {/* Studio Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAIDirectorModal={() => setIsAIDirectorModalOpen(true)}
        onAddImages={handleAddImages}
        onLoadSampleProject={handleLoadSampleProject}
        clipCount={clips.length}
        totalDuration={totalDuration}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        pastCount={pastCount}
        futureCount={futureCount}
        lastAction={lastAction}
      />

      {/* Main Workspace (Player Canvas + Inspector Sidebar) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Center Live Canvas Player */}
        <VideoPlayer
          clips={clips}
          settings={settings}
          audioTrack={audioTrack}
          currentTime={currentTime}
          onTimeUpdate={setCurrentTime}
          selectedClipIndex={selectedClipIndex}
          onSelectClip={setSelectedClipIndex}
        />

        {/* Right Inspector Sidebar */}
        <Inspector
          clip={selectedClip}
          clipIndex={selectedClipIndex}
          onUpdateClip={handleUpdateClip}
          audioTrack={audioTrack}
          onUpdateAudioTrack={handleUpdateAudioTrack}
          onAIDirectSingleScene={handleAIDirectSingleScene}
          isAILoading={isAILoading}
          onClearAllTextOverlays={handleClearAllTextOverlays}
        />
      </div>

      {/* Bottom Storyboard & Sequence Timeline */}
      <Timeline
        clips={clips}
        selectedClipIndex={selectedClipIndex}
        onSelectClip={setSelectedClipIndex}
        onUpdateClip={handleUpdateClip}
        onReorderClips={handleReorderClips}
        onDeleteClip={handleDeleteClip}
        onDuplicateClip={handleDuplicateClip}
        onAddImages={handleAddImages}
        currentTime={currentTime}
        onSeek={setCurrentTime}
        audioTrack={audioTrack}
      />

      {/* Export HD Video Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        clips={clips}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        audioTrack={audioTrack}
      />

      {/* AI Storyboard & Motion Director Modal */}
      <AIDirectorModal
        isOpen={isAIDirectorModalOpen}
        onClose={() => setIsAIDirectorModalOpen(false)}
        clips={clips}
        onApplyDirecting={handleApplyDirecting}
        settings={settings}
      />
    </div>
  );
}

export default App;
