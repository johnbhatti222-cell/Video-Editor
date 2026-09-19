import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  Sliders,
  Type,
  Music,
  Wand2,
  Eye,
  Plus,
  Trash2,
  Film,
  Sun,
  Activity,
  Maximize2,
  Layers,
  Check,
  Zap,
} from "lucide-react";
import {
  ImageClip,
  MotionType,
  EasingCurve,
  TransitionType,
  ColorFilter,
  ParticleFX,
  TextAnimation,
  TextPosition,
  AudioTrack,
  SynthPreset,
  TextLayer,
} from "../types";

interface InspectorProps {
  clip: ImageClip | null;
  clipIndex: number;
  onUpdateClip: (index: number, updates: Partial<ImageClip>) => void;
  audioTrack: AudioTrack;
  onUpdateAudioTrack: (updates: Partial<AudioTrack>) => void;
  onAIDirectSingleScene: (index: number) => Promise<void>;
  isAILoading: boolean;
  onClearAllTextOverlays?: () => void;
}

type TabType = "motion" | "transitions" | "fx" | "text" | "audio";

export const Inspector: React.FC<InspectorProps> = ({
  clip,
  clipIndex,
  onUpdateClip,
  audioTrack,
  onUpdateAudioTrack,
  onAIDirectSingleScene,
  isAILoading,
  onClearAllTextOverlays,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("motion");
  const audioFileInputRef = React.useRef<HTMLInputElement>(null);

  if (!clip) {
    return (
      <div className="w-80 lg:w-96 bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col items-center justify-center text-center text-neutral-400">
        <Sliders className="w-10 h-10 mb-3 text-neutral-600" />
        <p className="text-sm font-semibold text-neutral-300">No Scene Selected</p>
        <p className="text-xs mt-1">Select a scene from the timeline below to customize motion, transitions, and effects.</p>
      </div>
    );
  }

  // Motion types
  const motionOptions: { id: MotionType; name: string; desc: string; icon: string }[] = [
    { id: "zoom-in", name: "Zoom In", desc: "Slow cinematic zoom in towards focal point", icon: "🔍+" },
    { id: "zoom-out", name: "Zoom Out", desc: "Reveal perspective zooming out", icon: "🔍-" },
    { id: "pan-left", name: "Pan Left", desc: "Horizontal sweeping leftwards pan", icon: "←" },
    { id: "pan-right", name: "Pan Right", desc: "Horizontal sweeping rightwards pan", icon: "→" },
    { id: "pan-up", name: "Pan Up", desc: "Ascending vertical tilt pan", icon: "↑" },
    { id: "pan-down", name: "Pan Down", desc: "Descending vertical tilt pan", icon: "↓" },
    { id: "orbit-cw", name: "Orbit (CW)", desc: "Clockwise cinematic swirl curve", icon: "↻" },
    { id: "orbit-ccw", name: "Orbit (CCW)", desc: "Counter-clockwise swirl curve", icon: "↺" },
    { id: "tilt-3d", name: "3D Parallax Tilt", desc: "Simulated 2.5D perspective tilt & roll", icon: "📐" },
    { id: "dolly-slow", name: "Slow Dolly", desc: "Gentle cinematic camera dolly move", icon: "🎬" },
    { id: "float-drift", name: "Floating Drift", desc: "Organic floating breathing motion", icon: "🌊" },
    { id: "pulse", name: "Dynamic Pulse", desc: "Heartbeat rhythmic zoom pulse", icon: "💓" },
    { id: "dynamic-shake", name: "Action Shake", desc: "Handheld camera dynamic rumble", icon: "⚡" },
  ];

  // Easing options
  const easingOptions: { id: EasingCurve; label: string }[] = [
    { id: "ease-in-out", label: "Smooth (Ease In-Out)" },
    { id: "linear", label: "Constant (Linear)" },
    { id: "ease-out", label: "Decelerate (Ease Out)" },
    { id: "ease-in", label: "Accelerate (Ease In)" },
    { id: "spring", label: "Elastic (Spring)" },
  ];

  // Transitions
  const transitionOptions: { id: TransitionType; name: string; icon: string }[] = [
    { id: "none", name: "Cut (None)", icon: "✕" },
    { id: "crossfade", name: "Crossfade", icon: "⧉" },
    { id: "zoom-morph", name: "Zoom Morph", icon: "⤢" },
    { id: "wipe-left", name: "Wipe Left", icon: "◀" },
    { id: "wipe-right", name: "Wipe Right", icon: "▶" },
    { id: "wipe-up", name: "Wipe Up", icon: "▲" },
    { id: "wipe-down", name: "Wipe Down", icon: "▼" },
    { id: "push-left", name: "Push Left", icon: "⇦" },
    { id: "push-right", name: "Push Right", icon: "⇨" },
    { id: "push-up", name: "Push Up", icon: "⇧" },
    { id: "glitch", name: "RGB Glitch", icon: "⚡" },
    { id: "film-burn", name: "Film Burn Flare", icon: "🔥" },
    { id: "blur-dissolve", name: "Blur Dissolve", icon: "◌" },
    { id: "circle-iris", name: "Circle Iris", icon: "◎" },
    { id: "cube-flip", name: "3D Cube Flip", icon: "⚅" },
    { id: "diamond-wipe", name: "Diamond Wipe", icon: "◇" },
  ];

  // Color Filters
  const colorFilters: { id: ColorFilter; label: string; bg: string }[] = [
    { id: "none", label: "Natural", bg: "bg-neutral-800" },
    { id: "cinematic", label: "Teal & Orange", bg: "bg-gradient-to-r from-teal-900 to-amber-700" },
    { id: "vintage", label: "Kodak Film", bg: "bg-gradient-to-r from-amber-900 to-yellow-800" },
    { id: "cyberpunk", label: "Cyberpunk Neon", bg: "bg-gradient-to-r from-pink-900 to-cyan-900" },
    { id: "noir", label: "Noir Monocrome", bg: "bg-gradient-to-r from-neutral-950 to-neutral-600" },
    { id: "warm-sunset", label: "Golden Sunset", bg: "bg-gradient-to-r from-orange-900 to-amber-600" },
    { id: "dreamy", label: "Dreamy Pastel", bg: "bg-gradient-to-r from-purple-900 to-pink-700" },
    { id: "hdr", label: "HDR Clarity", bg: "bg-gradient-to-r from-blue-900 to-indigo-700" },
    { id: "vhs", label: "VHS Retro 90s", bg: "bg-gradient-to-r from-purple-950 to-emerald-950" },
    { id: "sepia", label: "Antique Sepia", bg: "bg-gradient-to-r from-amber-950 to-amber-800" },
  ];

  // Particles
  const particleOptions: { id: ParticleFX; label: string; icon: string }[] = [
    { id: "none", label: "None", icon: "✕" },
    { id: "bokeh", label: "Golden Bokeh", icon: "✨" },
    { id: "dust", label: "Sunlight Dust", icon: "💫" },
    { id: "rain", label: "Raindrops", icon: "🌧" },
    { id: "snow", label: "Gentle Snow", icon: "❄" },
    { id: "embers", label: "Fire Embers", icon: "🔥" },
    { id: "light-leak", label: "Lens Flares", icon: "🌈" },
    { id: "sparkles", label: "Star Sparkles", icon: "⭐" },
    { id: "confetti", label: "Party Confetti", icon: "🎉" },
  ];

  // Fonts
  const fonts = [
    { id: "Cinzel", label: "Cinzel (Epic Cinematic)" },
    { id: "Playfair Display", label: "Playfair Display (Luxury Serif)" },
    { id: "Space Grotesk", label: "Space Grotesk (Tech Modern)" },
    { id: "Montserrat", label: "Montserrat (Bold Display)" },
    { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Clean Modern)" },
    { id: "Inter", label: "Inter (Neutral Clean)" },
  ];

  // Text entrance animations
  const textAnimations: { id: TextAnimation; label: string }[] = [
    { id: "fade-up", label: "Smooth Fade Up" },
    { id: "typewriter", label: "Typewriter Live Cursor" },
    { id: "scale-pop", label: "Spring Scale Pop" },
    { id: "slide-in", label: "Cinematic Slide In" },
    { id: "kinetic-bounce", label: "Kinetic Bounce" },
    { id: "glow-pulse", label: "Glowing Pulse" },
    { id: "static", label: "Static" },
  ];

  // Text Positions
  const textPositions: { id: TextPosition; label: string }[] = [
    { id: "lower-third", label: "Lower Third (Default)" },
    { id: "bottom", label: "Bottom Centered" },
    { id: "center", label: "Direct Center" },
    { id: "top", label: "Top Header" },
  ];

  // Soundtracks
  const synthPresets: { id: SynthPreset; title: string; genre: string }[] = [
    { id: "cinematic-ambient", title: "Cinematic Horizons", genre: "Orchestral Ambient" },
    { id: "retro-wave", title: "Midnight Overdrive", genre: "Cyber Synthwave" },
    { id: "lofi-chill", title: "Ocean Whisper", genre: "Lofi Chill & Piano" },
    { id: "epic-orchestral", title: "Summit of Destiny", genre: "Epic Symphony" },
    { id: "uplifting-electronic", title: "Neon Aurora", genre: "Uplifting Future" },
    { id: "gentle-piano", title: "Golden Memories", genre: "Gentle Acoustic Piano" },
  ];

  // Handle Focal Point click
  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onUpdateClip(clipIndex, {
      motion: {
        ...clip.motion,
        focusX: x,
        focusY: y,
      },
    });
  };

  // Add new text layer
  const handleAddTextLayer = () => {
    const newLayer: TextLayer = {
      id: `txt-${Date.now()}`,
      text: "YOUR CINEMATIC TITLE",
      subtext: "Optional subtitle description",
      fontFamily: "Cinzel",
      fontSize: 44,
      color: "#ffffff",
      strokeColor: "rgba(0,0,0,0.6)",
      strokeWidth: 2,
      shadow: true,
      position: "lower-third",
      animation: "fade-up",
      startTime: 0.5,
      duration: Math.max(2, clip.duration - 1),
    };
    onUpdateClip(clipIndex, {
      textOverlays: [...(clip.textOverlays || []), newLayer],
    });
  };

  const handleUpdateTextLayer = (txtIndex: number, updates: Partial<TextLayer>) => {
    const nextLayers = [...(clip.textOverlays || [])];
    nextLayers[txtIndex] = { ...nextLayers[txtIndex], ...updates };
    onUpdateClip(clipIndex, { textOverlays: nextLayers });
  };

  const handleDeleteTextLayer = (txtIndex: number) => {
    const nextLayers = (clip.textOverlays || []).filter((_, i) => i !== txtIndex);
    onUpdateClip(clipIndex, { textOverlays: nextLayers });
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const audioUrl = URL.createObjectURL(file);
      onUpdateAudioTrack({
        type: "custom-upload",
        title: file.name.replace(/\.[^/.]+$/, ""),
        genre: "Custom Upload",
        customAudioUrl: audioUrl,
        customAudioBlob: file,
        enabled: true,
      });
    }
  };

  return (
    <div className="w-80 lg:w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-hidden shrink-0">
      {/* Inspector Header */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold">
              Scene #{clipIndex + 1}
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[140px]">
              {clip.name}
            </span>
          </div>
        </div>

        {/* AI Auto-Direct this scene */}
        <button
          onClick={() => onAIDirectSingleScene(clipIndex)}
          disabled={isAILoading}
          className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 text-purple-200 text-[11px] font-semibold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
          title="Direct motion, transition, and caption for this scene with Gemini"
        >
          <Wand2 className={`w-3 h-3 text-purple-300 ${isAILoading ? "animate-spin" : ""}`} />
          <span>{isAILoading ? "Directing..." : "AI Direct"}</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center bg-neutral-950 border-b border-neutral-800 px-1 py-1 text-xs gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("motion")}
          className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
            activeTab === "motion"
              ? "bg-neutral-800 text-indigo-300 shadow-sm font-semibold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Motion</span>
        </button>

        <button
          onClick={() => setActiveTab("transitions")}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
            activeTab === "transitions"
              ? "bg-neutral-800 text-indigo-300 shadow-sm font-semibold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Transitions</span>
        </button>

        <button
          onClick={() => setActiveTab("fx")}
          className={`flex-1 min-w-[55px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
            activeTab === "fx"
              ? "bg-neutral-800 text-indigo-300 shadow-sm font-semibold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>FX</span>
        </button>

        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 min-w-[55px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
            activeTab === "text"
              ? "bg-neutral-800 text-indigo-300 shadow-sm font-semibold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex-1 min-w-[60px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
            activeTab === "audio"
              ? "bg-neutral-800 text-indigo-300 shadow-sm font-semibold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-neutral-300 scrollbar-thin scrollbar-thumb-neutral-700">
        {/* ================= TAB 1: MOTION ================= */}
        {activeTab === "motion" && (
          <div className="space-y-4">
            {/* Motion Type Grid */}
            <div>
              <label className="font-semibold text-neutral-200 block mb-2">
                Camera Motion & Trajectory
              </label>
              <div className="grid grid-cols-2 gap-2">
                {motionOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() =>
                      onUpdateClip(clipIndex, {
                        motion: { ...clip.motion, type: opt.id },
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      clip.motion.type === opt.id
                        ? "bg-indigo-950/70 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                        : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{opt.name}</span>
                      <span className="text-sm">{opt.icon}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-tight truncate">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Slider */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-200">Motion Depth / Intensity</span>
                <span className="font-mono text-indigo-400 font-semibold">
                  {clip.motion.intensity.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={clip.motion.intensity}
                onChange={(e) =>
                  onUpdateClip(clipIndex, {
                    motion: { ...clip.motion, intensity: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Subtle (0.5x)</span>
                <span>Standard (1.0x)</span>
                <span>Dramatic (2.0x)</span>
              </div>
            </div>

            {/* Easing Selector */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2">
              <label className="font-medium text-neutral-200 block">Speed Acceleration Curve</label>
              <select
                value={clip.motion.easing}
                onChange={(e) =>
                  onUpdateClip(clipIndex, {
                    motion: { ...clip.motion, easing: e.target.value as EasingCurve },
                  })
                }
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-lg p-2 outline-none focus:border-indigo-500"
              >
                {easingOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive Focal Point Picker */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium text-neutral-200">Focal Zoom Target Center</label>
                <span className="text-[10px] text-neutral-400">Click photo to aim</span>
              </div>
              <div
                onClick={handleFocalPointClick}
                className="relative h-28 w-full rounded-lg overflow-hidden cursor-crosshair border border-neutral-700 group"
              >
                <img
                  src={clip.imageUrl}
                  alt="Focal"
                  className="w-full h-full object-cover"
                />
                {/* Target Circle Marker */}
                <div
                  style={{
                    left: `${clip.motion.focusX * 100}%`,
                    top: `${clip.motion.focusY * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-indigo-400 bg-indigo-500/30 flex items-center justify-center pointer-events-none shadow-lg shadow-indigo-500/50 animate-pulse"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>X: {Math.round(clip.motion.focusX * 100)}%</span>
                <span>Y: {Math.round(clip.motion.focusY * 100)}%</span>
              </div>
            </div>

            {/* Scene Display Duration */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-200">Scene Duration</span>
                <span className="font-mono text-indigo-400 font-semibold">{clip.duration.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={1.5}
                max={10.0}
                step={0.5}
                value={clip.duration}
                onChange={(e) =>
                  onUpdateClip(clipIndex, { duration: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 2: TRANSITIONS ================= */}
        {activeTab === "transitions" && (
          <div className="space-y-4">
            <div>
              <label className="font-semibold text-neutral-200 block mb-2">
                Transition to Next Scene
              </label>
              <div className="grid grid-cols-2 gap-2">
                {transitionOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      onUpdateClip(clipIndex, {
                        transition: { ...clip.transition, type: t.id },
                      })
                    }
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      clip.transition.type === t.id
                        ? "bg-purple-950/70 border-purple-500 text-white shadow-md ring-1 ring-purple-500/40"
                        : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <span className="text-base w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
                      {t.icon}
                    </span>
                    <span className="font-semibold text-xs truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transition Duration */}
            {clip.transition.type !== "none" && (
              <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">Transition Duration</span>
                  <span className="font-mono text-purple-400 font-semibold">
                    {clip.transition.duration.toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={2.0}
                  step={0.1}
                  value={clip.transition.duration}
                  onChange={(e) =>
                    onUpdateClip(clipIndex, {
                      transition: {
                        ...clip.transition,
                        duration: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: FX & COLOR GRADE ================= */}
        {activeTab === "fx" && (
          <div className="space-y-4">
            {/* Color Grade Filters */}
            <div>
              <label className="font-semibold text-neutral-200 block mb-2">
                Cinematic Color Grade
              </label>
              <div className="grid grid-cols-2 gap-2">
                {colorFilters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateClip(clipIndex, { filter: f.id })}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      clip.filter === f.id
                        ? "border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/40 bg-neutral-800"
                        : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 bg-neutral-950/60"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md ${f.bg} border border-neutral-700 shrink-0`} />
                    <span className="font-semibold text-xs truncate">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Particle Effects */}
            <div>
              <label className="font-semibold text-neutral-200 block mb-2">
                Particle Overlays & Atmosphere
              </label>
              <div className="grid grid-cols-3 gap-2">
                {particleOptions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onUpdateClip(clipIndex, { particleFx: p.id })}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      clip.particleFx === p.id
                        ? "bg-purple-950/70 border-purple-500 text-white shadow-md ring-1 ring-purple-500/40"
                        : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[11px] font-medium truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Film Grain & Vignette */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-200">Cinematic Vignette</span>
                <input
                  type="checkbox"
                  checked={clip.vignette}
                  onChange={(e) => onUpdateClip(clipIndex, { vignette: e.target.checked })}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">35mm Film Grain</span>
                  <span className="font-mono text-neutral-400">
                    {Math.round(clip.filmGrain * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={clip.filmGrain}
                  onChange={(e) =>
                    onUpdateClip(clipIndex, { filmGrain: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Brightness, Contrast, Saturation */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">Brightness</span>
                  <span className="font-mono text-neutral-400">{clip.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={clip.brightness}
                  onChange={(e) =>
                    onUpdateClip(clipIndex, { brightness: parseInt(e.target.value) })
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">Contrast</span>
                  <span className="font-mono text-neutral-400">{clip.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={clip.contrast}
                  onChange={(e) =>
                    onUpdateClip(clipIndex, { contrast: parseInt(e.target.value) })
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">Saturation</span>
                  <span className="font-mono text-neutral-400">{clip.saturation}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={clip.saturation}
                  onChange={(e) =>
                    onUpdateClip(clipIndex, { saturation: parseInt(e.target.value) })
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: TEXT & CAPTIONS ================= */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-200">Animated Text Layers</label>
              <button
                onClick={handleAddTextLayer}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Layer</span>
              </button>
            </div>

            {(!clip.textOverlays || clip.textOverlays.length === 0) && (
              <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl p-4 text-neutral-400">
                <p>No text overlays in this scene.</p>
                <button
                  onClick={handleAddTextLayer}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  + Add Title Overlay
                </button>
              </div>
            )}

            {clip.textOverlays?.map((txt, tIdx) => (
              <div
                key={txt.id}
                className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-300">Text Overlay #{tIdx + 1}</span>
                  <button
                    onClick={() => handleDeleteTextLayer(tIdx)}
                    className="text-neutral-500 hover:text-red-400 p-1"
                    title="Delete layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Text */}
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Main Title Text</label>
                  <input
                    type="text"
                    value={txt.text}
                    onChange={(e) => handleUpdateTextLayer(tIdx, { text: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                    placeholder="Enter main text..."
                  />
                </div>

                {/* Subtext */}
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Subtitle / Description</label>
                  <input
                    type="text"
                    value={txt.subtext || ""}
                    onChange={(e) => handleUpdateTextLayer(tIdx, { subtext: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                    placeholder="Optional subtitle..."
                  />
                </div>

                {/* Font Family */}
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Font Typography</label>
                  <select
                    value={txt.fontFamily}
                    onChange={(e) => handleUpdateTextLayer(tIdx, { fontFamily: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg p-2 text-xs outline-none"
                  >
                    {fonts.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Animation Type */}
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Entrance Animation</label>
                  <select
                    value={txt.animation}
                    onChange={(e) =>
                      handleUpdateTextLayer(tIdx, { animation: e.target.value as TextAnimation })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg p-2 text-xs outline-none"
                  >
                    {textAnimations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Position Placement</label>
                  <select
                    value={txt.position}
                    onChange={(e) =>
                      handleUpdateTextLayer(tIdx, { position: e.target.value as TextPosition })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg p-2 text-xs outline-none"
                  >
                    {textPositions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400">Font Size ({txt.fontSize}px)</label>
                    <input
                      type="range"
                      min={24}
                      max={72}
                      value={txt.fontSize}
                      onChange={(e) =>
                        handleUpdateTextLayer(tIdx, { fontSize: parseInt(e.target.value) })
                      }
                      className="w-full h-1 bg-neutral-800 rounded accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={txt.color}
                        onChange={(e) => handleUpdateTextLayer(tIdx, { color: e.target.value })}
                        className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[10px] text-neutral-400">{txt.color}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {onClearAllTextOverlays && (
              <div className="pt-2 border-t border-neutral-800/80">
                <button
                  onClick={onClearAllTextOverlays}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-red-300 border border-neutral-800 hover:border-red-900/50 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Text Overlays (All Scenes)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: AUDIO SOUNDTRACK ================= */}
        {activeTab === "audio" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-200">Audio Soundtrack</label>
              <input
                type="checkbox"
                checked={audioTrack.enabled}
                onChange={(e) => onUpdateAudioTrack({ enabled: e.target.checked })}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Built-in Presets */}
            <div className="space-y-2">
              <label className="text-neutral-400 text-[11px]">Cinematic Web Audio Synthesizer</label>
              <div className="space-y-1.5">
                {synthPresets.map((synth) => (
                  <button
                    key={synth.id}
                    onClick={() =>
                      onUpdateAudioTrack({
                        type: "builtin-synth",
                        synthPreset: synth.id,
                        title: synth.title,
                        genre: synth.genre,
                        enabled: true,
                      })
                    }
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      audioTrack.type === "builtin-synth" && audioTrack.synthPreset === synth.id
                        ? "bg-indigo-950/70 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/40"
                        : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs text-neutral-200">{synth.title}</p>
                      <p className="text-[10px] text-neutral-400">{synth.genre}</p>
                    </div>
                    {audioTrack.type === "builtin-synth" && audioTrack.synthPreset === synth.id && (
                      <Check className="w-4 h-4 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2">
              <label className="font-medium text-neutral-200 block">Or Upload Custom Music (MP3 / WAV)</label>
              <input
                ref={audioFileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleCustomAudioUpload}
              />
              <button
                onClick={() => audioFileInputRef.current?.click()}
                className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
              >
                Upload Audio File
              </button>
              {audioTrack.type === "custom-upload" && (
                <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300">
                  Active custom track: <strong>{audioTrack.title}</strong>
                </div>
              )}
            </div>

            {/* Volume & Fade */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">Track Volume</span>
                  <span className="font-mono text-indigo-400 font-semibold">
                    {Math.round(audioTrack.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audioTrack.volume}
                  onChange={(e) => onUpdateAudioTrack({ volume: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={audioTrack.fadeIn}
                    onChange={(e) => onUpdateAudioTrack({ fadeIn: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-indigo-600"
                  />
                  <span>Fade In</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={audioTrack.fadeOut}
                    onChange={(e) => onUpdateAudioTrack({ fadeOut: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-indigo-600"
                  />
                  <span>Fade Out</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
