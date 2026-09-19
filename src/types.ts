export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9";

export type ResolutionOption = "720p" | "1080p" | "4K";

export type FPSOption = 24 | 30 | 60;

export type MotionType =
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "pan-up"
  | "pan-down"
  | "orbit-cw"
  | "orbit-ccw"
  | "tilt-3d"
  | "dolly-slow"
  | "float-drift"
  | "pulse"
  | "dynamic-shake";

export type EasingCurve = "ease-in-out" | "linear" | "ease-in" | "ease-out" | "spring";

export type TransitionType =
  | "none"
  | "crossfade"
  | "wipe-left"
  | "wipe-right"
  | "wipe-up"
  | "wipe-down"
  | "zoom-morph"
  | "push-left"
  | "push-right"
  | "push-up"
  | "glitch"
  | "film-burn"
  | "blur-dissolve"
  | "circle-iris"
  | "cube-flip"
  | "diamond-wipe";

export type ColorFilter =
  | "none"
  | "cinematic"
  | "vintage"
  | "cyberpunk"
  | "noir"
  | "warm-sunset"
  | "dreamy"
  | "hdr"
  | "vhs"
  | "sepia";

export type ParticleFX =
  | "none"
  | "bokeh"
  | "dust"
  | "rain"
  | "snow"
  | "embers"
  | "light-leak"
  | "sparkles"
  | "confetti";

export type TextAnimation =
  | "fade-up"
  | "typewriter"
  | "scale-pop"
  | "slide-in"
  | "kinetic-bounce"
  | "glow-pulse"
  | "static";

export type TextPosition = "top" | "center" | "bottom" | "lower-third" | "custom";

export interface TextLayer {
  id: string;
  text: string;
  subtext?: string;
  fontFamily: string;
  fontSize: number; // Base size relative to 1080p (e.g. 48)
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
  position: TextPosition;
  customY?: number; // 0 to 100 percentage
  animation: TextAnimation;
  startTime: number; // Relative to clip in seconds
  duration: number; // In seconds
}

export interface ImageClip {
  id: string;
  name: string;
  imageUrl: string;
  duration: number; // Duration in seconds (e.g. 3.5)
  motion: {
    type: MotionType;
    intensity: number; // 0.5 to 2.0
    easing: EasingCurve;
    focusX: number; // 0 to 1
    focusY: number; // 0 to 1
  };
  transition: {
    type: TransitionType;
    duration: number; // In seconds (e.g. 0.8)
  };
  filter: ColorFilter;
  particleFx: ParticleFX;
  textOverlays: TextLayer[];
  vignette: boolean;
  filmGrain: number; // 0 to 1
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
}

export type SynthPreset =
  | "cinematic-ambient"
  | "lofi-chill"
  | "epic-orchestral"
  | "uplifting-electronic"
  | "gentle-piano"
  | "retro-wave";

export interface AudioTrack {
  id: string;
  title: string;
  genre: string;
  type: "builtin-synth" | "custom-upload";
  synthPreset: SynthPreset;
  customAudioUrl?: string;
  customAudioBlob?: Blob;
  volume: number; // 0 to 1
  fadeIn: boolean;
  fadeOut: boolean;
  enabled: boolean;
}

export interface ProjectSettings {
  title: string;
  aspectRatio: AspectRatio;
  letterbox: boolean;
  fps: FPSOption;
  exportResolution: ResolutionOption;
  exportFormat: "webm" | "mp4" | "gif";
  loop: boolean;
}

export interface ExportProgress {
  status: "idle" | "rendering" | "encoding" | "completed" | "error";
  progress: number; // 0 - 100
  currentFrame: number;
  totalFrames: number;
  etaSeconds: number;
  exportedBlob?: Blob;
  exportedUrl?: string;
  error?: string;
}

export interface ResolutionDimension {
  width: number;
  height: number;
  label: string;
}
