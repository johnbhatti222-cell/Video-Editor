import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Repeat,
  Sparkles,
  Layers,
  ZoomIn,
} from "lucide-react";
import { ImageClip, ProjectSettings, AudioTrack } from "../types";
import { globalRenderEngine } from "../utils/renderEngine";
import { globalAudioEngine } from "../utils/audioEngine";

interface VideoPlayerProps {
  clips: ImageClip[];
  settings: ProjectSettings;
  audioTrack: AudioTrack;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  selectedClipIndex: number;
  onSelectClip: (index: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  clips,
  settings,
  audioTrack,
  currentTime,
  onTimeUpdate,
  selectedClipIndex,
  onSelectClip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(audioTrack.volume);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalDuration = globalRenderEngine.getTotalDuration(clips);

  // Preload images on clip change
  useEffect(() => {
    globalRenderEngine.preloadImages(clips);
  }, [clips]);

  // Sync volume
  useEffect(() => {
    globalAudioEngine.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Format time (00:00.0)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  // Keyboard shortcut for spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(0, currentTime - 0.5));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(totalDuration, currentTime + 0.5));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, currentTime, totalDuration]);

  // Render current frame
  const renderFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dimensions = globalRenderEngine.getAspectRatioDimensions(settings.aspectRatio, 1080);
    if (canvas.width !== dimensions.width || canvas.height !== dimensions.height) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
    }

    globalRenderEngine.render({
      canvas,
      ctx,
      timeSec: time,
      totalDurationSec: totalDuration,
      clips,
      settings,
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      globalAudioEngine.play(audioTrack, currentTime, totalDuration);
      lastTimestampRef.current = performance.now();

      const loop = (now: number) => {
        if (lastTimestampRef.current !== null) {
          const deltaSec = (now - lastTimestampRef.current) / 1000;
          let nextTime = currentTime + deltaSec;

          if (nextTime >= totalDuration) {
            if (settings.loop) {
              nextTime = 0;
              globalAudioEngine.play(audioTrack, 0, totalDuration);
            } else {
              nextTime = totalDuration;
              setIsPlaying(false);
              globalAudioEngine.stop();
            }
          }

          onTimeUpdate(nextTime);
          renderFrame(nextTime);
        }
        lastTimestampRef.current = now;
        if (isPlaying) {
          animFrameRef.current = requestAnimationFrame(loop);
        }
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      globalAudioEngine.stop();
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      globalAudioEngine.stop();
    };
  }, [isPlaying, totalDuration, settings.loop, audioTrack]);

  // Re-render when time or clip changes externally
  useEffect(() => {
    if (!isPlaying) {
      renderFrame(currentTime);
    }
  }, [currentTime, clips, settings]);

  const togglePlay = () => {
    if (currentTime >= totalDuration && !isPlaying) {
      onTimeUpdate(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const seek = (time: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, time));
    onTimeUpdate(clamped);
    renderFrame(clamped);
    if (isPlaying) {
      globalAudioEngine.seek(audioTrack, clamped, totalDuration);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Find active clip for badge
  let cumTime = 0;
  let activeClip = clips[0];
  for (let i = 0; i < clips.length; i++) {
    if (currentTime >= cumTime && currentTime <= cumTime + clips[i].duration) {
      activeClip = clips[i];
      break;
    }
    cumTime += clips[i].duration;
  }

  // Compute aspect ratio CSS style
  const getAspectRatioStyle = () => {
    switch (settings.aspectRatio) {
      case "9:16":
        return { aspectRatio: "9 / 16", maxHeight: "68vh" };
      case "1:1":
        return { aspectRatio: "1 / 1", maxHeight: "68vh" };
      case "4:5":
        return { aspectRatio: "4 / 5", maxHeight: "68vh" };
      case "21:9":
        return { aspectRatio: "21 / 9", width: "100%", maxHeight: "56vh" };
      case "16:9":
      default:
        return { aspectRatio: "16 / 9", width: "100%", maxHeight: "64vh" };
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-neutral-950/60 p-4 relative overflow-hidden items-center justify-between"
    >
      {/* Top Overlay Badges */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-neutral-400 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
            {settings.aspectRatio} • {settings.fps} FPS
          </span>
          {activeClip && (
            <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-indigo-300 font-medium truncate max-w-[200px]">
              🎬 {activeClip.name} ({activeClip.motion.type})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeClip && activeClip.filter !== "none" && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-800/50 text-indigo-300 capitalize">
              {activeClip.filter}
            </span>
          )}
          {activeClip && activeClip.particleFx !== "none" && (
            <span className="px-2 py-0.5 rounded-md bg-purple-950/70 border border-purple-800/50 text-purple-300 capitalize flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              {activeClip.particleFx}
            </span>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 w-full flex items-center justify-center p-2 relative group min-h-0">
        <div
          style={getAspectRatioStyle()}
          className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/80 flex items-center justify-center transition-all"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Big Play Overlay on Pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/40 backdrop-blur-sm transition-all transform hover:scale-110 active:scale-95 z-20"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Player Bottom Control Bar */}
      <div className="w-full max-w-4xl bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 shadow-xl mt-2 flex flex-col gap-2">
        {/* Scrubber Progress Slider */}
        <div className="relative w-full group/slider flex items-center">
          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.01}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 group-hover/slider:h-2 transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          {/* Left: Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => seek(0)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Jump to Start"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => seek(Math.max(0, currentTime - 1))}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Back 1 second"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Loop Toggle */}
            <button
              onClick={() => onTimeUpdate(currentTime)}
              className={`p-2 rounded-xl border transition-colors ${
                settings.loop
                  ? "bg-indigo-950/80 border-indigo-800 text-indigo-300"
                  : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
              title="Loop Playback"
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Timecode */}
            <div className="ml-2 font-mono text-xs text-neutral-300 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
              <span className="text-white font-semibold">{formatTime(currentTime)}</span>
              <span className="text-neutral-500 mx-1">/</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Right: Audio Volume & Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Audio volume slider */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                title="Soundtrack Volume"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
