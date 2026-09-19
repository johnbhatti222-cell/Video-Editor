import React, { useState } from "react";
import {
  Wand2,
  X,
  Sparkles,
  Film,
  Camera,
  Layers,
  Palette,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { ImageClip, AudioTrack, ProjectSettings } from "../types";

interface AIDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: ImageClip[];
  onApplyDirecting: (updatedClips: ImageClip[], suggestedAudio?: Partial<AudioTrack>) => void;
  settings: ProjectSettings;
}

export const AIDirectorModal: React.FC<AIDirectorModalProps> = ({
  isOpen,
  onClose,
  clips,
  onApplyDirecting,
  settings,
}) => {
  const [theme, setTheme] = useState("Epic Cinematic Story");
  const [customPrompt, setCustomPrompt] = useState("");
  const [targetAudience, setTargetAudience] = useState("Cinematic Showcase");
  const [includeCaptions, setIncludeCaptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const themes = [
    {
      id: "Epic Cinematic Story",
      icon: "🎬",
      desc: "Slow dramatic zooms, film burn & crossfade transitions, rich teal/orange tones, ambient orchestra.",
    },
    {
      id: "Cyberpunk 2099",
      icon: "⚡",
      desc: "Fast zoom morphs, RGB glitch effects, neon color grading, high-energy synth music.",
    },
    {
      id: "Nostalgic 35mm Memory",
      icon: "🎞",
      desc: "Gentle pan drifts, vintage film grain, warm golden hour tones, lofi piano melody.",
    },
    {
      id: "Luxury Brand Showcase",
      icon: "✨",
      desc: "Subtle 3D parallax tilts, smooth blur dissolves, golden bokeh particles, refined luxury serif titles.",
    },
    {
      id: "Nature & Wilderness Odyssey",
      icon: "🏔",
      desc: "Expansive camera push-ins, sunlight dust particles, HDR clarity, uplifting horizon soundtrack.",
    },
    {
      id: "Social Media Reel & Short",
      icon: "📱",
      desc: "Dynamic pulse motions, snappy directional wipes, vibrant saturation, kinetic pop typography.",
    },
  ];

  const handleRunDirector = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/direct-motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips: clips.map((c, i) => ({
            id: c.id,
            name: c.name,
            index: i,
            currentMotion: c.motion.type,
          })),
          theme: customPrompt.trim() ? `${theme} - ${customPrompt.trim()}` : theme,
          aspectRatio: settings.aspectRatio,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to receive AI director recommendations");
      }

      const data = await response.json();
      const directions = data.directions || [];

      // Merge directions with existing clips
      const updatedClips: ImageClip[] = clips.map((clip, index) => {
        const dir = directions[index] || directions[0] || {};
        return {
          ...clip,
          duration: dir.duration || clip.duration,
          motion: {
            ...clip.motion,
            type: dir.motionType || clip.motion.type,
            intensity: dir.intensity || clip.motion.intensity,
            easing: dir.easing || clip.motion.easing,
            focusX: dir.focusX !== undefined ? dir.focusX : clip.motion.focusX,
            focusY: dir.focusY !== undefined ? dir.focusY : clip.motion.focusY,
          },
          transition: {
            ...clip.transition,
            type: dir.transitionType || clip.transition.type,
            duration: dir.transitionDuration || clip.transition.duration,
          },
          filter: dir.filter || clip.filter,
          particleFx: dir.particleFx || clip.particleFx,
          textOverlays: includeCaptions && dir.titleText
            ? [
                {
                  id: `txt-ai-${Date.now()}-${index}`,
                  text: dir.titleText,
                  subtext: dir.subtitleText || "",
                  fontFamily: dir.fontFamily || "Cinzel",
                  fontSize: 44,
                  color: "#ffffff",
                  strokeColor: "rgba(0,0,0,0.6)",
                  strokeWidth: 2,
                  shadow: true,
                  position: "lower-third",
                  animation: "fade-up",
                  startTime: 0.5,
                  duration: Math.max(2, (dir.duration || clip.duration) - 0.8),
                },
              ]
            : clip.textOverlays,
        };
      });

      // Apply audio recommendation if provided
      let suggestedAudio: Partial<AudioTrack> | undefined = undefined;
      if (data.recommendedAudio) {
        suggestedAudio = {
          type: "builtin-synth",
          synthPreset: data.recommendedAudio.synthPreset || "cinematic-ambient",
          title: data.recommendedAudio.title || "AI Directed Theme",
          genre: data.recommendedAudio.genre || "Cinematic Sound",
          enabled: true,
        };
      }

      onApplyDirecting(updatedClips, suggestedAudio);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.error("AI Director Error:", err);
      setError(err.message || "Failed to generate AI storyboard direction.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Wand2 className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Storyboard & Motion Director</h2>
            <p className="text-xs text-neutral-400">
              Powered by Gemini 3.8 Flash • Automatically choreographs camera motion, transitions, color grade & poetic captions.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Theme Presets */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">
              Select Cinematic Style / Mood
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    theme === t.id
                      ? "bg-purple-950/70 border-purple-500 text-white shadow-md ring-2 ring-purple-500/40"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-200">
                    <span>{t.icon}</span>
                    <span>{t.id}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction Prompt */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Custom Vision & Directing Notes (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Make the pacing build up gradually towards the mountain peak scene, with dramatic bokeh and golden sunrise atmosphere..."
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl p-2.5 text-xs text-neutral-200 outline-none placeholder-neutral-500 transition-colors"
            />
          </div>

          {/* Text Overlay Option (Off by default) */}
          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-neutral-200 block">
                Generate AI Text & Caption Overlays
              </span>
              <span className="text-[11px] text-neutral-400 block">
                Off by default. Check if you want AI to generate lower-third title subtitles.
              </span>
            </div>
            <input
              type="checkbox"
              checked={includeCaptions}
              onChange={(e) => setIncludeCaptions(e.target.checked)}
              className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
          </div>

          {/* Scope Indicator */}
          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-400" />
              <span>Choreographing <strong>{clips.length} Scenes</strong></span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
              Aspect {settings.aspectRatio}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Execute CTA */}
          <button
            onClick={handleRunDirector}
            disabled={isLoading || clips.length === 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Directing Scenes with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Auto-Direct Storyboard with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
