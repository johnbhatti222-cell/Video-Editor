import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  CheckCircle2,
  Film,
  Sparkles,
  Sliders,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Eye,
  Settings2,
  Volume2,
  VolumeX,
  Maximize2,
  Repeat,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  ImageClip,
  ProjectSettings,
  AudioTrack,
  ExportProgress,
  ResolutionOption,
  FPSOption,
} from "../types";
import { VideoExportRecorder } from "../utils/exportRecorder";
import { globalRenderEngine } from "../utils/renderEngine";
import { globalAudioEngine } from "../utils/audioEngine";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: ImageClip[];
  settings: ProjectSettings;
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void;
  audioTrack: AudioTrack;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  clips,
  settings,
  onUpdateSettings,
  audioTrack,
}) => {
  const [activeTab, setActiveTab] = useState<"settings" | "preview">("settings");
  const [recorderInstance, setRecorderInstance] = useState<VideoExportRecorder | null>(null);
  const [progressState, setProgressState] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    etaSeconds: 0,
  });
  const [resultData, setResultData] = useState<{ url: string; filename: string; blob: Blob } | null>(null);

  // Pre-render preview player state
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const [previewTime, setPreviewTime] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);

  const totalDurationSec = globalRenderEngine.getTotalDuration(clips);

  // Preload images
  useEffect(() => {
    if (isOpen) {
      globalRenderEngine.preloadImages(clips);
    }
  }, [isOpen, clips]);

  // Clean up canvas anim & audio on unmount or tab switch
  useEffect(() => {
    if (!isOpen || activeTab !== "preview" || progressState.status !== "idle") {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      globalAudioEngine.stop();
      setIsPreviewPlaying(false);
    }
  }, [isOpen, activeTab, progressState.status]);

  // Render preview frame on canvas
  const renderPreviewFrame = (time: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dimensions = globalRenderEngine.getAspectRatioDimensions(settings.aspectRatio, 720);
    if (canvas.width !== dimensions.width || canvas.height !== dimensions.height) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
    }

    globalRenderEngine.render({
      canvas,
      ctx,
      timeSec: time,
      totalDurationSec,
      clips,
      settings,
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  // Update canvas when previewTime changes and not playing
  useEffect(() => {
    if (activeTab === "preview" && !isPreviewPlaying) {
      renderPreviewFrame(previewTime);
    }
  }, [previewTime, activeTab, settings, clips]);

  // Preview animation loop
  const previewLoop = (timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }
    const delta = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    setPreviewTime((prevTime) => {
      let next = prevTime + delta;
      if (next >= totalDurationSec) {
        if (settings.loop) {
          next = 0;
          if (audioTrack.enabled && !isPreviewMuted) {
            globalAudioEngine.play(audioTrack, 0, totalDurationSec);
          }
        } else {
          setIsPreviewPlaying(false);
          globalAudioEngine.stop();
          return totalDurationSec;
        }
      }
      renderPreviewFrame(next);
      return next;
    });

    animFrameRef.current = requestAnimationFrame(previewLoop);
  };

  // Toggle preview play/pause
  const togglePreviewPlay = () => {
    if (isPreviewPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      globalAudioEngine.stop();
      setIsPreviewPlaying(false);
    } else {
      let startFrom = previewTime;
      if (startFrom >= totalDurationSec) {
        startFrom = 0;
        setPreviewTime(0);
      }
      lastTimestampRef.current = null;
      if (audioTrack.enabled && !isPreviewMuted) {
        globalAudioEngine.play(audioTrack, startFrom, totalDurationSec);
      }
      setIsPreviewPlaying(true);
      animFrameRef.current = requestAnimationFrame(previewLoop);
    }
  };

  const handlePreviewSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(totalDurationSec, newTime));
    setPreviewTime(clamped);
    renderPreviewFrame(clamped);
    if (isPreviewPlaying && audioTrack.enabled && !isPreviewMuted) {
      globalAudioEngine.play(audioTrack, clamped, totalDurationSec);
    }
  };

  if (!isOpen) return null;

  const startExport = async () => {
    // Stop any ongoing preview playback
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    globalAudioEngine.stop();
    setIsPreviewPlaying(false);

    const recorder = new VideoExportRecorder(globalRenderEngine);
    setRecorderInstance(recorder);
    setResultData(null);
    setProgressState({
      status: "rendering",
      progress: 0,
      currentFrame: 0,
      totalFrames: Math.ceil(totalDurationSec * settings.fps),
      etaSeconds: 0,
    });

    try {
      const res = await recorder.exportVideo(
        clips,
        settings,
        audioTrack,
        globalAudioEngine,
        (p) => setProgressState(p)
      );

      setResultData(res);
      setProgressState((prev) => ({ ...prev, status: "completed", progress: 100 }));

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      if (err.message?.includes("cancelled")) {
        setProgressState({ status: "idle", progress: 0, currentFrame: 0, totalFrames: 0, etaSeconds: 0 });
      } else {
        console.error("Export error:", err);
        setProgressState({
          status: "error",
          progress: 0,
          currentFrame: 0,
          totalFrames: 0,
          etaSeconds: 0,
          error: err.message || "Failed to render video",
        });
      }
    }
  };

  const cancelExport = () => {
    if (recorderInstance) {
      recorderInstance.cancel();
    }
    setProgressState({ status: "idle", progress: 0, currentFrame: 0, totalFrames: 0, etaSeconds: 0 });
  };

  const handleDownload = () => {
    if (!resultData) return;
    const a = document.createElement("a");
    a.href = resultData.url;
    a.download = resultData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={progressState.status === "rendering"}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Export & Preview Video</h2>
            <p className="text-xs text-neutral-400">
              Preview animated camera motions, transitions, and export in high-definition.
            </p>
          </div>
        </div>

        {/* IDLE STATE: Tab Switcher & Body */}
        {progressState.status === "idle" && (
          <div className="flex flex-col flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Tab Controls: Settings vs Live Sequence Preview */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0">
              <button
                onClick={() => {
                  if (isPreviewPlaying) togglePreviewPlay();
                  setActiveTab("settings");
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "settings"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Export Configuration</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("preview");
                  // Trigger frame render immediately
                  setTimeout(() => renderPreviewFrame(previewTime), 50);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "preview"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Sequence Preview</span>
              </button>
            </div>

            {/* TAB 1: Export Settings */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Resolution Selector */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-2">
                    Export Resolution
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "1080p", title: "1080p Full HD", desc: "1920×1080 (Recommended)", badge: "Crisp" },
                      { id: "4K", title: "4K Ultra HD", desc: "3840×2160 (Master Quality)", badge: "Cinema" },
                      { id: "720p", title: "720p HD", desc: "1280×720 (Fast Render)", badge: "Light" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onUpdateSettings({ exportResolution: r.id as ResolutionOption })}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          settings.exportResolution === r.id
                            ? "bg-indigo-950/70 border-indigo-500 text-white ring-2 ring-indigo-500/40 shadow-lg"
                            : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{r.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-800 font-mono text-indigo-300">
                            {r.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame Rate & Format */}
                <div className="grid grid-cols-2 gap-3">
                  {/* FPS */}
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-2">
                      Frame Rate
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
                      {([60, 30, 24] as FPSOption[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => onUpdateSettings({ fps: f })}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            settings.fps === f
                              ? "bg-indigo-600 text-white shadow-md"
                              : "text-neutral-400 hover:text-neutral-200"
                          }`}
                        >
                          {f} FPS
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-2">
                      Container Format
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
                      {(["webm", "mp4"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => onUpdateSettings({ exportFormat: fmt })}
                          className={`py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                            settings.exportFormat === fmt
                              ? "bg-indigo-600 text-white shadow-md"
                              : "text-neutral-400 hover:text-neutral-200"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Box & Preview Action */}
                <div className="bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">{settings.title || "Image Animation"}</p>
                    <p className="text-[11px] text-neutral-400">
                      {clips.length} Scenes • {totalDurationSec.toFixed(1)}s • {settings.aspectRatio} • {settings.exportResolution}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("preview");
                      setTimeout(() => renderPreviewFrame(previewTime), 50);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Preview</span>
                  </button>
                </div>

                {/* Start Button */}
                <button
                  onClick={startExport}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Start High-Definition Render</span>
                </button>
              </div>
            )}

            {/* TAB 2: Live Sequence Preview */}
            {activeTab === "preview" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Canvas Player Box */}
                <div className="relative rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-xl flex items-center justify-center min-h-[200px] max-h-[250px] group">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-h-[250px] w-full object-contain"
                  />

                  {/* Play/Pause Overlay Click */}
                  <div
                    onClick={togglePreviewPlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                  >
                    {!isPreviewPlaying && (
                      <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                        <Play className="w-5 h-5 ml-0.5 fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Top Badge Overlay */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-neutral-300 border border-white/10 pointer-events-none">
                    {settings.aspectRatio} • {formatTime(previewTime)} / {formatTime(totalDurationSec)}
                  </div>
                </div>

                {/* Timeline Scrub Slider */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={totalDurationSec || 1}
                    step={0.05}
                    value={previewTime}
                    onChange={(e) => handlePreviewSeek(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>{formatTime(previewTime)}</span>
                    <span className="text-neutral-500">{clips.length} Scenes</span>
                    <span>{formatTime(totalDurationSec)}</span>
                  </div>
                </div>

                {/* Preview Mini Controls */}
                <div className="flex items-center justify-between bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePreviewPlay}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      title={isPreviewPlaying ? "Pause" : "Play"}
                    >
                      {isPreviewPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handlePreviewSeek(0)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Restart Sequence"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {audioTrack.enabled && (
                      <button
                        onClick={() => {
                          const nextMuted = !isPreviewMuted;
                          setIsPreviewMuted(nextMuted);
                          globalAudioEngine.setVolume(nextMuted ? 0 : audioTrack.volume);
                        }}
                        className={`p-2 rounded-lg border transition-colors ${
                          isPreviewMuted
                            ? "bg-neutral-900 border-neutral-700 text-neutral-500"
                            : "bg-neutral-800 border-neutral-700 text-indigo-300"
                        }`}
                        title={isPreviewMuted ? "Unmute Preview Audio" : "Mute Preview Audio"}
                      >
                        {isPreviewMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}

                    <span className="text-[11px] text-neutral-400 font-medium">
                      {audioTrack.enabled ? audioTrack.title : "No Audio"}
                    </span>
                  </div>
                </div>

                {/* Direct Action from Preview Tab */}
                <button
                  onClick={startExport}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Render This Sequence in {settings.exportResolution}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* RENDERING STATE: Live Progress */}
        {progressState.status === "rendering" && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
            {/* Progress Percentage Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-neutral-800"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={351.8}
                  strokeDashoffset={351.8 - (351.8 * progressState.progress) / 100}
                  className="text-indigo-500 transition-all duration-200"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-mono">
                  {progressState.progress}%
                </span>
                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                  Rendering
                </span>
              </div>
            </div>

            {/* Frame Stats */}
            <div className="space-y-1 text-xs text-neutral-300">
              <p className="font-semibold text-neutral-200">
                Frame {progressState.currentFrame} of {progressState.totalFrames}
              </p>
              <p className="text-neutral-400 font-mono text-[11px]">
                Estimated Time Remaining: ~{progressState.etaSeconds}s
              </p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={cancelExport}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
            >
              Cancel Render
            </button>
          </div>
        )}

        {/* COMPLETED STATE: Interactive Preview Player & Download */}
        {progressState.status === "completed" && resultData && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200 flex flex-col flex-1 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs justify-center">
              <CheckCircle2 className="w-4 h-4" />
              <span>High-Definition Video Render Complete!</span>
            </div>

            {/* Interactive Final Video Player Preview */}
            <div className="rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-xl max-h-64 flex items-center justify-center relative group">
              <video
                src={resultData.url}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-64 w-full object-contain"
              />
            </div>

            {/* Video File Meta & Details */}
            <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
              <div className="truncate max-w-[240px] space-y-0.5">
                <p className="truncate text-neutral-200 font-semibold">{resultData.filename}</p>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {settings.exportResolution} • {settings.fps} FPS • {settings.exportFormat.toUpperCase()}
                </p>
              </div>
              <span className="text-indigo-400 font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-800/80 shrink-0">
                {(resultData.blob.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            {/* Action Buttons: Download & Re-render */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() =>
                  setProgressState({ status: "idle", progress: 0, currentFrame: 0, totalFrames: 0, etaSeconds: 0 })
                }
                className="flex-1 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Adjust & Re-render</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Download Video File</span>
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {progressState.status === "error" && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 flex items-center justify-center border border-red-800">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-red-400">Export Failed</p>
              <p className="text-xs text-neutral-400 max-w-sm">{progressState.error}</p>
            </div>
            <button
              onClick={() =>
                setProgressState({ status: "idle", progress: 0, currentFrame: 0, totalFrames: 0, etaSeconds: 0 })
              }
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

