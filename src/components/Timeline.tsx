import React, { useRef } from "react";
import {
  Plus,
  Trash2,
  Copy,
  MoveLeft,
  MoveRight,
  Sparkles,
  Type,
  Music,
  Clock,
  Layers,
  Zap,
  ArrowRight,
} from "lucide-react";
import { ImageClip, TransitionType, AudioTrack } from "../types";

interface TimelineProps {
  clips: ImageClip[];
  selectedClipIndex: number;
  onSelectClip: (index: number) => void;
  onUpdateClip: (index: number, updates: Partial<ImageClip>) => void;
  onReorderClips: (fromIndex: number, toIndex: number) => void;
  onDeleteClip: (index: number) => void;
  onDuplicateClip: (index: number) => void;
  onAddImages: (files: FileList) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  audioTrack: AudioTrack;
}

export const Timeline: React.FC<TimelineProps> = ({
  clips,
  selectedClipIndex,
  onSelectClip,
  onUpdateClip,
  onReorderClips,
  onDeleteClip,
  onDuplicateClip,
  onAddImages,
  currentTime,
  onSeek,
  audioTrack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalDuration = clips.reduce((acc, c) => acc + c.duration, 0);

  const transitionIcons: Record<TransitionType, string> = {
    none: "✕",
    crossfade: "⧉",
    "wipe-left": "◀",
    "wipe-right": "▶",
    "wipe-up": "▲",
    "wipe-down": "▼",
    "zoom-morph": "⤢",
    "push-left": "⇦",
    "push-right": "⇨",
    "push-up": "⇧",
    glitch: "⚡",
    "film-burn": "🔥",
    "blur-dissolve": "◌",
    "circle-iris": "◎",
    "cube-flip": "⚅",
    "diamond-wipe": "◇",
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files);
      e.target.value = "";
    }
  };

  // Find clip starts
  let cumTime = 0;
  const clipStartTimes: number[] = [];
  clips.forEach((c) => {
    clipStartTimes.push(cumTime);
    cumTime += c.duration;
  });

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-3 select-none flex flex-col gap-2 shrink-0">
      {/* Timeline Bar Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Storyboard Timeline</span>
          </div>
          <span className="text-neutral-500">|</span>
          <span className="font-mono text-neutral-400">
            {clips.length} Scenes • {totalDuration.toFixed(1)}s Total
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddPhotos}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors flex items-center gap-1 border border-neutral-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {/* Main Track 1: Clips Storyboard */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-neutral-700">
        {clips.map((clip, index) => {
          const isSelected = selectedClipIndex === index;
          const clipStart = clipStartTimes[index];
          const isCurrentPlayhead =
            currentTime >= clipStart && currentTime < clipStart + clip.duration;

          return (
            <React.Fragment key={clip.id}>
              {/* Clip Thumbnail Card */}
              <div
                onClick={() => {
                  onSelectClip(index);
                  onSeek(clipStart);
                }}
                className={`relative group shrink-0 w-36 sm:w-44 h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30"
                    : isCurrentPlayhead
                    ? "border-indigo-400/80"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Background Image */}
                <img
                  src={clip.imageUrl}
                  alt={clip.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

                {/* Top Badge: Clip Number & Motion */}
                <div className="relative z-10 p-1.5 flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-black/70 text-white font-mono font-bold">
                    #{index + 1}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/50 text-indigo-200 font-medium">
                    {clip.motion.type}
                  </span>
                </div>

                {/* Bottom Row: Name, Duration Adjuster, Actions */}
                <div className="relative z-10 p-1.5 flex items-center justify-between text-[11px] text-white">
                  <span className="font-semibold truncate max-w-[70px]">{clip.name}</span>
                  
                  {/* Duration Slider inline */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-neutral-700/50 text-[10px] font-mono"
                  >
                    <Clock className="w-2.5 h-2.5 text-neutral-400" />
                    <input
                      type="number"
                      step={0.5}
                      min={1}
                      max={20}
                      value={clip.duration}
                      onChange={(e) =>
                        onUpdateClip(index, { duration: Math.max(1, parseFloat(e.target.value) || 1) })
                      }
                      className="w-8 bg-transparent text-center font-bold text-neutral-200 outline-none"
                    />
                    <span>s</span>
                  </div>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderClips(index, index - 1);
                      }}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white"
                      title="Move Left"
                    >
                      <MoveLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateClip(index);
                    }}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white"
                    title="Duplicate Scene"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {clips.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClip(index);
                      }}
                      className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/60"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {index < clips.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderClips(index, index + 1);
                      }}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white"
                      title="Move Right"
                    >
                      <MoveRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Transition Marker between clips */}
              {index < clips.length - 1 && (
                <div className="flex flex-col items-center justify-center shrink-0">
                  <button
                    onClick={() => {
                      onSelectClip(index);
                      // Trigger transition selector
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border shadow-sm ${
                      clip.transition.type !== "none"
                        ? "bg-purple-950/90 border-purple-700 text-purple-300 hover:bg-purple-900"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200"
                    }`}
                    title={`Transition: ${clip.transition.type} (${clip.transition.duration}s)`}
                  >
                    <span>{transitionIcons[clip.transition.type] || "⧉"}</span>
                  </button>
                  <span className="text-[9px] font-mono text-neutral-400 mt-0.5">
                    {clip.transition.duration}s
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Add Clip Card */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-28 sm:w-32 h-24 rounded-xl border-2 border-dashed border-neutral-800 hover:border-indigo-500/60 bg-neutral-950/40 hover:bg-neutral-900/50 flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:text-indigo-300 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">Add Photo</span>
        </button>
      </div>

      {/* Track 2 & 3 Secondary Indicators: Audio Track & Captions Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-neutral-800/60">
        {/* Audio Track Pill */}
        <div className="bg-neutral-950/80 px-3 py-2 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center">
              <Music className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-200 truncate">{audioTrack.title}</p>
              <p className="text-[10px] text-neutral-400">{audioTrack.genre} • Volume {Math.round(audioTrack.volume * 100)}%</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-800/40 text-indigo-300">
            {audioTrack.enabled ? "Active" : "Muted"}
          </span>
        </div>

        {/* Active Clip Subtitles Pill */}
        <div className="bg-neutral-950/80 px-3 py-2 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-lg bg-purple-950 text-purple-400 flex items-center justify-center shrink-0">
              <Type className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-neutral-200 truncate">
                {clips[selectedClipIndex]?.textOverlays?.[0]?.text || "No text overlay"}
              </p>
              <p className="text-[10px] text-neutral-400">
                {clips[selectedClipIndex]?.textOverlays?.[0]?.animation || "Static"} • {clips[selectedClipIndex]?.textOverlays?.[0]?.fontFamily || "Default"}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-800/40 text-purple-300 shrink-0">
            Scene #{selectedClipIndex + 1}
          </span>
        </div>
      </div>
    </div>
  );
};
