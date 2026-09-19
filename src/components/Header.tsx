import React from "react";
import {
  Video,
  Sparkles,
  Download,
  Plus,
  Tv,
  Layers,
  Wand2,
  FolderOpen,
  Maximize2,
  Undo2,
  Redo2,
} from "lucide-react";
import { AspectRatio, ProjectSettings, ResolutionOption } from "../types";
import { SAMPLE_PROJECTS } from "../data/sampleProjects";

interface HeaderProps {
  settings: ProjectSettings;
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void;
  onOpenExportModal: () => void;
  onOpenAIDirectorModal: () => void;
  onAddImages: (files: FileList) => void;
  onLoadSampleProject: (projectId: string) => void;
  clipCount: number;
  totalDuration: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  pastCount?: number;
  futureCount?: number;
  lastAction?: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenExportModal,
  onOpenAIDirectorModal,
  onAddImages,
  onLoadSampleProject,
  clipCount,
  totalDuration,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  pastCount = 0,
  futureCount = 0,
  lastAction,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const aspectRatios: { id: AspectRatio; label: string; icon: string }[] = [
    { id: "16:9", label: "16:9 (Landscape HD)", icon: "▭" },
    { id: "9:16", label: "9:16 (Reels/Shorts)", icon: "▯" },
    { id: "1:1", label: "1:1 (Square)", icon: "□" },
    { id: "4:5", label: "4:5 (Social)", icon: "▯" },
    { id: "21:9", label: "21:9 (Cinematic)", icon: "▬" },
  ];

  const resolutions: ResolutionOption[] = ["1080p", "4K", "720p"];

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <header className="bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.title}
                onChange={(e) => onUpdateSettings({ title: e.target.value })}
                className="bg-transparent font-bold text-white text-base hover:bg-neutral-800/60 focus:bg-neutral-800 px-2 py-0.5 rounded-lg border border-transparent focus:border-neutral-700 outline-none transition-colors w-48 sm:w-64"
                placeholder="Untitled Animation"
              />
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-medium">
                HD Studio
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400 pl-2">
              <span>{clipCount} {clipCount === 1 ? "Scene" : "Scenes"}</span>
              <span>•</span>
              <span>{totalDuration.toFixed(1)}s Total</span>
            </div>
          </div>
        </div>

        {/* Center: Aspect Ratio & Presets */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Selector */}
          <div className="bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 flex items-center gap-1">
            {aspectRatios.map((ar) => (
              <button
                key={ar.id}
                onClick={() => onUpdateSettings({ aspectRatio: ar.id })}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  settings.aspectRatio === ar.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
                title={ar.label}
              >
                <span className="text-sm leading-none">{ar.icon}</span>
                <span>{ar.id}</span>
              </button>
            ))}
          </div>

          {/* Letterbox Cinema Toggle */}
          {settings.aspectRatio === "16:9" && (
            <button
              onClick={() => onUpdateSettings({ letterbox: !settings.letterbox })}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                settings.letterbox
                  ? "bg-amber-950/60 border-amber-700/60 text-amber-300"
                  : "bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
              title="Toggle 2.39:1 Cinematic Letterbox Anamorphic Bars"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Cinema Bars</span>
            </button>
          )}

          {/* Templates Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-950/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-all flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Templates</span>
            </button>
            <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                Preset Storyboards
              </div>
              {SAMPLE_PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => onLoadSampleProject(proj.id)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-neutral-800 text-xs text-neutral-200 hover:text-white transition-colors flex items-center gap-2.5 group/item"
                >
                  <img
                    src={proj.thumbnail}
                    alt={proj.name}
                    className="w-10 h-6 object-cover rounded border border-neutral-700 shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="font-semibold truncate">{proj.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{proj.clips.length} clips • {proj.settings.aspectRatio}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Undo / Redo History Stack Controls */}
          <div className="bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 flex items-center gap-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-xs font-medium transition-all text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400 relative group/undo"
              title={`Undo (${navigator.platform.toUpperCase().indexOf("MAC") >= 0 ? "⌘Z" : "Ctrl+Z"})${lastAction ? ` - ${lastAction}` : ""}`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              {pastCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 text-[9px] font-mono font-bold rounded-full bg-indigo-600 text-white flex items-center justify-center pointer-events-none">
                  {pastCount > 9 ? "9+" : pastCount}
                </span>
              )}
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-xs font-medium transition-all text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400 relative group/redo"
              title={`Redo (${navigator.platform.toUpperCase().indexOf("MAC") >= 0 ? "⌘⇧Z" : "Ctrl+Y"})`}
            >
              <Redo2 className="w-3.5 h-3.5" />
              {futureCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 text-[9px] font-mono font-bold rounded-full bg-purple-600 text-white flex items-center justify-center pointer-events-none">
                  {futureCount > 9 ? "9+" : futureCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right Actions: AI Director, Add Photos, Export */}
        <div className="flex items-center gap-2.5">
          {/* AI Magic Director */}
          <button
            onClick={onOpenAIDirectorModal}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-900 hover:to-indigo-900 border border-purple-700/50 text-purple-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-purple-900/20 active:scale-95"
            title="Open AI Motion & Storyboard Director"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>AI Director</span>
          </button>

          {/* Add Photos Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 text-neutral-300" />
            <span>Add Photos</span>
          </button>

          {/* Export HD Video CTA */}
          <button
            onClick={onOpenExportModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export HD Video</span>
          </button>
        </div>
      </div>
    </header>
  );
};
