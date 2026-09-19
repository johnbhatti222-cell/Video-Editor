import {
  ImageClip,
  ProjectSettings,
  MotionType,
  EasingCurve,
  TransitionType,
  ColorFilter,
  ParticleFX,
  TextLayer,
  AspectRatio,
} from "../types";

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  timeSec: number;
  totalDurationSec: number;
  clips: ImageClip[];
  settings: ProjectSettings;
  width: number;
  height: number;
}

// Particle state tracking
interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue?: number;
  rotation?: number;
}

export class VideoRenderEngine {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private particles: Particle[] = [];
  private lastParticleType: ParticleFX = "none";
  private offscreenCanvasA: HTMLCanvasElement;
  private offscreenCtxA: CanvasRenderingContext2D;
  private offscreenCanvasB: HTMLCanvasElement;
  private offscreenCtxB: CanvasRenderingContext2D;

  constructor() {
    this.offscreenCanvasA = document.createElement("canvas");
    this.offscreenCtxA = this.offscreenCanvasA.getContext("2d", { willReadFrequently: true })!;
    this.offscreenCanvasB = document.createElement("canvas");
    this.offscreenCtxB = this.offscreenCanvasB.getContext("2d", { willReadFrequently: true })!;
  }

  public async preloadImages(clips: ImageClip[]): Promise<void> {
    const promises = clips.map((clip) => this.getImage(clip.imageUrl));
    await Promise.all(promises);
  }

  public getImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = (err) => {
        console.warn("Failed to load image:", url, err);
        // Fallback placeholder image
        const fallback = document.createElement("canvas");
        fallback.width = 1920;
        fallback.height = 1080;
        const fctx = fallback.getContext("2d")!;
        fctx.fillStyle = "#1e293b";
        fctx.fillRect(0, 0, 1920, 1080);
        fctx.fillStyle = "#94a3b8";
        fctx.font = "bold 48px sans-serif";
        fctx.textAlign = "center";
        fctx.fillText("Preview Image", 960, 540);
        const fallbackImg = new Image();
        fallbackImg.src = fallback.toDataURL();
        this.imageCache.set(url, fallbackImg);
        resolve(fallbackImg);
      };
      img.src = url;
    });
  }

  public getTotalDuration(clips: ImageClip[]): number {
    return clips.reduce((acc, clip) => acc + clip.duration, 0);
  }

  public getAspectRatioDimensions(aspect: AspectRatio, targetHeight = 1080): { width: number; height: number } {
    switch (aspect) {
      case "9:16": // Vertical Reels/Shorts
        return { width: Math.round((targetHeight * 9) / 16), height: targetHeight };
      case "1:1": // Square
        return { width: targetHeight, height: targetHeight };
      case "4:5": // Instagram Portrait
        return { width: Math.round((targetHeight * 4) / 5), height: targetHeight };
      case "21:9": // Cinematic Ultrawide
        return { width: Math.round((targetHeight * 21) / 9), height: targetHeight };
      case "16:9": // Landscape HD
      default:
        return { width: Math.round((targetHeight * 16) / 9), height: targetHeight };
    }
  }

  public render(params: RenderContext) {
    const { canvas, ctx, timeSec, clips, settings, width, height } = params;
    if (clips.length === 0) {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Resize offscreens if needed
    if (this.offscreenCanvasA.width !== width || this.offscreenCanvasA.height !== height) {
      this.offscreenCanvasA.width = width;
      this.offscreenCanvasA.height = height;
      this.offscreenCanvasB.width = width;
      this.offscreenCanvasB.height = height;
    }

    // Find current clip and transition state
    let cumulativeTime = 0;
    let activeIndex = 0;
    let localTime = 0;

    for (let i = 0; i < clips.length; i++) {
      const clipDuration = clips[i].duration;
      if (timeSec >= cumulativeTime && timeSec < cumulativeTime + clipDuration) {
        activeIndex = i;
        localTime = timeSec - cumulativeTime;
        break;
      }
      cumulativeTime += clipDuration;
      if (i === clips.length - 1) {
        // At or beyond end of timeline
        activeIndex = clips.length - 1;
        localTime = clips[activeIndex].duration;
      }
    }

    const currentClip = clips[activeIndex];
    const nextClip = activeIndex < clips.length - 1 ? clips[activeIndex + 1] : settings.loop ? clips[0] : null;

    // Check if we are in transition zone at the end of current clip
    const transitionDuration = currentClip.transition.type !== "none" ? Math.min(currentClip.transition.duration, currentClip.duration * 0.5) : 0;
    const transitionStartTime = currentClip.duration - transitionDuration;
    const isTransitioning = nextClip !== null && transitionDuration > 0 && localTime >= transitionStartTime;

    if (!isTransitioning || !nextClip) {
      // Single clip rendering
      this.renderSingleClipToContext(this.offscreenCtxA, currentClip, localTime, width, height);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(this.offscreenCanvasA, 0, 0);
    } else {
      // Transition blend between currentClip and nextClip
      const transitionProgress = (localTime - transitionStartTime) / transitionDuration;
      const nextLocalTime = localTime - transitionStartTime;

      this.renderSingleClipToContext(this.offscreenCtxA, currentClip, localTime, width, height);
      this.renderSingleClipToContext(this.offscreenCtxB, nextClip, nextLocalTime, width, height);

      ctx.clearRect(0, 0, width, height);
      this.renderTransition(
        ctx,
        this.offscreenCanvasA,
        this.offscreenCanvasB,
        currentClip.transition.type,
        Math.max(0, Math.min(1, transitionProgress)),
        width,
        height
      );
    }

    // Cinematic Letterbox overlay (if enabled in 16:9 or standard mode)
    if (settings.letterbox && settings.aspectRatio === "16:9") {
      const barHeight = height * 0.12;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, barHeight);
      ctx.fillRect(0, height - barHeight, width, barHeight);
    }
  }

  private renderSingleClipToContext(
    ctx: CanvasRenderingContext2D,
    clip: ImageClip,
    localTime: number,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const img = this.imageCache.get(clip.imageUrl);
    const progress = Math.max(0, Math.min(1, localTime / Math.max(0.1, clip.duration)));
    const easedProgress = this.applyEasing(progress, clip.motion.easing);

    // 1. Motion & Camera Transform (Ken Burns, Pan, Zoom, 3D Tilt, Drift)
    if (img && img.complete && img.naturalWidth > 0) {
      this.renderImageWithMotion(ctx, img, clip, easedProgress, width, height, localTime);
    }

    // 2. Color Grading & Film Filters
    this.applyColorFilter(ctx, clip.filter, width, height);

    // 3. Brightness, Contrast, Saturation Adjustments
    if (clip.brightness !== 0 || clip.contrast !== 0 || clip.saturation !== 0) {
      this.applyColorAdjustments(ctx, clip.brightness, clip.contrast, clip.saturation, width, height);
    }

    // 4. Vignette Overlay
    if (clip.vignette) {
      this.renderVignette(ctx, width, height);
    }

    // 5. Film Grain
    if (clip.filmGrain > 0) {
      this.renderFilmGrain(ctx, clip.filmGrain, width, height);
    }

    // 6. Particle FX (Bokeh, Dust, Rain, Snow, Embers, Light Leaks)
    if (clip.particleFx !== "none") {
      this.renderParticles(ctx, clip.particleFx, localTime, width, height);
    }

    // 7. Text & Lower Third Overlays
    if (clip.textOverlays && clip.textOverlays.length > 0) {
      clip.textOverlays.forEach((txt) => {
        this.renderTextLayer(ctx, txt, localTime, width, height);
      });
    }

    ctx.restore();
  }

  private applyEasing(t: number, easing: EasingCurve): number {
    switch (easing) {
      case "linear":
        return t;
      case "ease-in":
        return t * t * t;
      case "ease-out":
        return 1 - Math.pow(1 - t, 3);
      case "spring":
        return 1 + Math.sin((t - 1) * Math.PI * 2.5) * Math.exp(-t * 3);
      case "ease-in-out":
      default:
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  }

  private renderImageWithMotion(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    clip: ImageClip,
    t: number,
    targetWidth: number,
    targetHeight: number,
    localTime: number
  ) {
    ctx.save();

    // Base Cover scale
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = targetWidth / targetHeight;

    let baseWidth = targetWidth;
    let baseHeight = targetHeight;

    if (canvasAspect > imgAspect) {
      baseWidth = targetWidth;
      baseHeight = targetWidth / imgAspect;
    } else {
      baseHeight = targetHeight;
      baseWidth = targetHeight * imgAspect;
    }

    // Motion parameters
    const intensity = clip.motion.intensity;
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;
    let rotation = 0;
    let skewX = 0;

    const motionType: MotionType = clip.motion.type;

    switch (motionType) {
      case "zoom-in": {
        const startScale = 1.0;
        const endScale = 1.0 + 0.35 * intensity;
        scale = startScale + (endScale - startScale) * t;
        const focusOffsetX = (clip.motion.focusX - 0.5) * (targetWidth * 0.15) * intensity;
        const focusOffsetY = (clip.motion.focusY - 0.5) * (targetHeight * 0.15) * intensity;
        translateX = -focusOffsetX * t;
        translateY = -focusOffsetY * t;
        break;
      }

      case "zoom-out": {
        const startScale = 1.0 + 0.35 * intensity;
        const endScale = 1.0;
        scale = startScale + (endScale - startScale) * t;
        const focusOffsetX = (clip.motion.focusX - 0.5) * (targetWidth * 0.15) * intensity;
        const focusOffsetY = (clip.motion.focusY - 0.5) * (targetHeight * 0.15) * intensity;
        translateX = -focusOffsetX * (1 - t);
        translateY = -focusOffsetY * (1 - t);
        break;
      }

      case "pan-left": {
        scale = 1.15 + 0.1 * intensity;
        const maxOffset = (targetWidth * 0.18) * intensity;
        translateX = maxOffset * (0.5 - t);
        break;
      }

      case "pan-right": {
        scale = 1.15 + 0.1 * intensity;
        const maxOffset = (targetWidth * 0.18) * intensity;
        translateX = -maxOffset * (0.5 - t);
        break;
      }

      case "pan-up": {
        scale = 1.15 + 0.1 * intensity;
        const maxOffset = (targetHeight * 0.18) * intensity;
        translateY = maxOffset * (0.5 - t);
        break;
      }

      case "pan-down": {
        scale = 1.15 + 0.1 * intensity;
        const maxOffset = (targetHeight * 0.18) * intensity;
        translateY = -maxOffset * (0.5 - t);
        break;
      }

      case "orbit-cw": {
        scale = 1.2 + 0.1 * intensity;
        const angle = t * Math.PI * 0.35 * intensity;
        rotation = angle * 0.04;
        translateX = Math.cos(angle) * (targetWidth * 0.06) * intensity;
        translateY = Math.sin(angle) * (targetHeight * 0.06) * intensity;
        break;
      }

      case "orbit-ccw": {
        scale = 1.2 + 0.1 * intensity;
        const angle = -t * Math.PI * 0.35 * intensity;
        rotation = angle * 0.04;
        translateX = Math.cos(angle) * (targetWidth * 0.06) * intensity;
        translateY = Math.sin(angle) * (targetHeight * 0.06) * intensity;
        break;
      }

      case "tilt-3d": {
        scale = 1.18 + 0.15 * intensity;
        skewX = Math.sin(t * Math.PI) * 0.06 * intensity;
        rotation = Math.cos(t * Math.PI) * 0.03 * intensity;
        translateX = Math.sin(t * Math.PI * 2) * (targetWidth * 0.04) * intensity;
        break;
      }

      case "dolly-slow": {
        scale = 1.05 + 0.18 * intensity * t;
        translateY = Math.sin(t * Math.PI) * (targetHeight * 0.03) * intensity;
        break;
      }

      case "float-drift": {
        scale = 1.12 + 0.05 * Math.sin(localTime * 1.5);
        translateX = Math.sin(localTime * 1.2) * (targetWidth * 0.03) * intensity;
        translateY = Math.cos(localTime * 0.9) * (targetHeight * 0.03) * intensity;
        rotation = Math.sin(localTime * 0.7) * 0.015;
        break;
      }

      case "pulse": {
        const beat = Math.abs(Math.sin(localTime * 3.5));
        scale = 1.08 + 0.12 * beat * intensity;
        break;
      }

      case "dynamic-shake": {
        scale = 1.2;
        const shakeX = (Math.random() - 0.5) * 14 * intensity;
        const shakeY = (Math.random() - 0.5) * 14 * intensity;
        translateX = shakeX;
        translateY = shakeY;
        rotation = (Math.random() - 0.5) * 0.015 * intensity;
        break;
      }
    }

    // Apply matrix transformation centered around canvas center
    const centerX = targetWidth / 2;
    const centerY = targetHeight / 2;

    ctx.translate(centerX + translateX, centerY + translateY);
    if (rotation !== 0) ctx.rotate(rotation);
    if (skewX !== 0) ctx.transform(1, 0, skewX, 1, 0, 0);
    ctx.scale(scale, scale);

    const drawW = baseWidth;
    const drawH = baseHeight;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();
  }

  private renderTransition(
    ctx: CanvasRenderingContext2D,
    canvasA: HTMLCanvasElement,
    canvasB: HTMLCanvasElement,
    type: TransitionType,
    progress: number,
    width: number,
    height: number
  ) {
    ctx.save();
    const p = Math.max(0, Math.min(1, progress));

    switch (type) {
      case "crossfade":
        ctx.drawImage(canvasA, 0, 0);
        ctx.globalAlpha = p;
        ctx.drawImage(canvasB, 0, 0);
        break;

      case "wipe-left":
        ctx.drawImage(canvasA, 0, 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(width * (1 - p), 0, width * p, height);
        ctx.clip();
        ctx.drawImage(canvasB, 0, 0);
        ctx.restore();
        // Subtle wipe line
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * (1 - p), 0);
        ctx.lineTo(width * (1 - p), height);
        ctx.stroke();
        break;

      case "wipe-right":
        ctx.drawImage(canvasA, 0, 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width * p, height);
        ctx.clip();
        ctx.drawImage(canvasB, 0, 0);
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * p, 0);
        ctx.lineTo(width * p, height);
        ctx.stroke();
        break;

      case "wipe-up":
        ctx.drawImage(canvasA, 0, 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, height * (1 - p), width, height * p);
        ctx.clip();
        ctx.drawImage(canvasB, 0, 0);
        ctx.restore();
        break;

      case "wipe-down":
        ctx.drawImage(canvasA, 0, 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, height * p);
        ctx.clip();
        ctx.drawImage(canvasB, 0, 0);
        ctx.restore();
        break;

      case "zoom-morph": {
        // Zoom out of A, zoom in from B
        const scaleA = 1.0 + p * 0.4;
        const alphaA = 1 - p;
        ctx.save();
        ctx.globalAlpha = alphaA;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scaleA, scaleA);
        ctx.drawImage(canvasA, -width / 2, -height / 2);
        ctx.restore();

        const scaleB = 1.4 - (1 - p) * 0.4;
        ctx.save();
        ctx.globalAlpha = p;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scaleB, scaleB);
        ctx.drawImage(canvasB, -width / 2, -height / 2);
        ctx.restore();
        break;
      }

      case "push-left":
        ctx.drawImage(canvasA, -width * p, 0);
        ctx.drawImage(canvasB, width * (1 - p), 0);
        break;

      case "push-right":
        ctx.drawImage(canvasA, width * p, 0);
        ctx.drawImage(canvasB, -width * (1 - p), 0);
        break;

      case "push-up":
        ctx.drawImage(canvasA, 0, -height * p);
        ctx.drawImage(canvasB, 0, height * (1 - p));
        break;

      case "glitch": {
        ctx.drawImage(p < 0.5 ? canvasA : canvasB, 0, 0);
        // RGB split slices
        const sliceCount = 8;
        for (let i = 0; i < sliceCount; i++) {
          const sliceY = (height / sliceCount) * i;
          const sliceH = height / sliceCount;
          const shift = (Math.random() - 0.5) * 40 * Math.sin(p * Math.PI);
          ctx.drawImage(
            p < 0.5 ? canvasA : canvasB,
            0,
            sliceY,
            width,
            sliceH,
            shift,
            sliceY,
            width,
            sliceH
          );
        }
        // Flash overlay
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.sin(p * Math.PI) * 0.35})`;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "film-burn": {
        ctx.drawImage(canvasA, 0, 0);
        ctx.globalAlpha = p;
        ctx.drawImage(canvasB, 0, 0);

        // Warm fiery burn flash
        const flashIntensity = Math.sin(p * Math.PI);
        const grad = ctx.createRadialGradient(
          width * (0.3 + p * 0.4),
          height * 0.5,
          10,
          width * 0.5,
          height * 0.5,
          width * 0.7
        );
        grad.addColorStop(0, `rgba(254, 240, 138, ${flashIntensity * 0.8})`);
        grad.addColorStop(0.5, `rgba(249, 115, 22, ${flashIntensity * 0.6})`);
        grad.addColorStop(1, `rgba(239, 68, 68, 0)`);

        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "blur-dissolve": {
        ctx.drawImage(canvasA, 0, 0);
        ctx.globalAlpha = p;
        ctx.drawImage(canvasB, 0, 0);
        // Soft white wash
        const wash = Math.sin(p * Math.PI) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${wash})`;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "circle-iris": {
        ctx.drawImage(canvasA, 0, 0);
        const maxRadius = Math.sqrt(width * width + height * height) / 2;
        const radius = maxRadius * p;
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(canvasB, 0, 0);
        ctx.restore();
        break;
      }

      case "cube-flip": {
        // 3D rotation simulation
        const scaleX_A = Math.cos(p * Math.PI * 0.5);
        if (p < 0.5) {
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(scaleX_A, 1.0 - p * 0.2);
          ctx.drawImage(canvasA, -width / 2, -height / 2);
          ctx.restore();
        } else {
          const scaleX_B = Math.sin(p * Math.PI * 0.5);
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(scaleX_B, 1.0 - (1 - p) * 0.2);
          ctx.drawImage(canvasB, -width / 2, -height / 2);
          ctx.restore();
        }
        break;
      }

      case "diamond-wipe": {
        ctx.drawImage(canvasA, 0, 0);
        const maxD = width + height;
        const d = maxD * p;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2 - d);
        ctx.lineTo(width / 2 + d, height / 2);
        ctx.lineTo(width / 2, height / 2 + d);
        ctx.lineTo(width / 2 - d, height / 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(canvasB, 0, 0);
        ctx.restore();
        break;
      }

      case "none":
      default:
        ctx.drawImage(p < 0.5 ? canvasA : canvasB, 0, 0);
        break;
    }

    ctx.restore();
  }

  private applyColorFilter(ctx: CanvasRenderingContext2D, filter: ColorFilter, width: number, height: number) {
    if (filter === "none") return;

    ctx.save();
    switch (filter) {
      case "cinematic": {
        // Teal shadows & orange highlights
        ctx.globalCompositeOperation = "color-dodge";
        ctx.fillStyle = "rgba(251, 146, 60, 0.15)"; // Warm orange high
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "rgba(14, 116, 144, 0.2)"; // Deep teal low
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "vintage": {
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = "rgba(217, 119, 6, 0.25)";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "soft-light";
        ctx.fillStyle = "rgba(254, 243, 199, 0.2)";
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "cyberpunk": {
        ctx.globalCompositeOperation = "color-dodge";
        ctx.fillStyle = "rgba(236, 72, 153, 0.2)"; // Neon Pink
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(6, 182, 212, 0.2)"; // Neon Cyan
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "noir": {
        // High contrast Black & White
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "warm-sunset": {
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = "rgba(249, 115, 22, 0.25)";
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "dreamy": {
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(244, 114, 182, 0.15)";
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "hdr": {
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "vhs": {
        // Retro scanlines
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.5);
        }
        ctx.globalCompositeOperation = "color-dodge";
        ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "sepia": {
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = "rgba(120, 53, 15, 0.4)";
        ctx.fillRect(0, 0, width, height);
        break;
      }
    }
    ctx.restore();
  }

  private applyColorAdjustments(
    ctx: CanvasRenderingContext2D,
    brightness: number,
    contrast: number,
    saturation: number,
    width: number,
    height: number
  ) {
    ctx.save();
    if (brightness > 0) {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness / 150})`;
      ctx.fillRect(0, 0, width, height);
    } else if (brightness < 0) {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.abs(brightness) / 100})`;
      ctx.fillRect(0, 0, width, height);
    }

    if (contrast > 0) {
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = `rgba(128, 128, 128, ${contrast / 120})`;
      ctx.fillRect(0, 0, width, height);
    }

    if (saturation > 0) {
      ctx.globalCompositeOperation = "color-dodge";
      ctx.fillStyle = `rgba(255, 255, 255, ${saturation / 250})`;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  private renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const radius = Math.max(width, height) * 0.75;
    const grad = ctx.createRadialGradient(width / 2, height / 2, radius * 0.3, width / 2, height / 2, radius);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.7, "rgba(0,0,0,0.3)");
    grad.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private renderFilmGrain(ctx: CanvasRenderingContext2D, intensity: number, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    const dotCount = Math.round((width * height * 0.0003) * intensity);
    for (let i = 0; i < dotCount; i++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      const gs = Math.random() * 2 + 0.5;
      ctx.fillRect(gx, gy, gs, gs);
    }
    ctx.restore();
  }

  private initParticles(type: ParticleFX, count = 40) {
    this.particles = [];
    this.lastParticleType = type;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 25 + 5,
        speedX: (Math.random() - 0.5) * 0.04,
        speedY: (Math.random() - 0.5) * 0.04,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 30, // Golden default
        rotation: Math.random() * Math.PI * 2,
      });
    }
  }

  private renderParticles(
    ctx: CanvasRenderingContext2D,
    type: ParticleFX,
    localTime: number,
    width: number,
    height: number
  ) {
    if (this.lastParticleType !== type || this.particles.length === 0) {
      this.initParticles(type, type === "rain" || type === "snow" ? 70 : 35);
    }

    ctx.save();

    switch (type) {
      case "bokeh": {
        this.particles.forEach((p, idx) => {
          const px = ((p.x + localTime * p.speedX * 0.4) % 1 + 1) % 1 * width;
          const py = ((p.y + localTime * p.speedY * 0.4) % 1 + 1) % 1 * height;
          const pulse = Math.sin(localTime * 2 + idx) * 0.2 + 0.8;
          const r = p.size * pulse;

          const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
          grad.addColorStop(0, `rgba(254, 240, 138, ${p.opacity * 0.7})`);
          grad.addColorStop(0.5, `rgba(251, 146, 60, ${p.opacity * 0.4})`);
          grad.addColorStop(1, `rgba(249, 115, 22, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case "dust": {
        ctx.fillStyle = "rgba(255, 255, 220, 0.45)";
        this.particles.forEach((p) => {
          const px = ((p.x + localTime * 0.02 * p.speedX) % 1 + 1) % 1 * width;
          const py = ((p.y + localTime * 0.03) % 1 + 1) % 1 * height;
          const r = Math.max(1, p.size * 0.1);
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case "rain": {
        ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
        ctx.lineWidth = 1.5;
        this.particles.forEach((p) => {
          const px = ((p.x + localTime * 0.15) % 1 + 1) % 1 * width;
          const py = ((p.y + localTime * 1.8) % 1 + 1) % 1 * height;
          const len = p.size * 1.8;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - len * 0.15, py + len);
          ctx.stroke();
        });
        break;
      }

      case "snow": {
        ctx.fillStyle = "rgba(248, 250, 252, 0.8)";
        this.particles.forEach((p, idx) => {
          const sway = Math.sin(localTime * 2 + idx) * 0.03;
          const px = ((p.x + sway) % 1 + 1) % 1 * width;
          const py = ((p.y + localTime * 0.12) % 1 + 1) % 1 * height;
          const r = Math.max(1.5, p.size * 0.2);
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case "embers": {
        this.particles.forEach((p, idx) => {
          const sway = Math.sin(localTime * 3 + idx) * 0.05;
          const px = ((p.x + sway) % 1 + 1) % 1 * width;
          const py = ((p.y - localTime * 0.18) % 1 + 1) % 1 * height;
          const r = Math.max(1.5, p.size * 0.15);

          ctx.fillStyle = `rgba(249, 115, 22, ${p.opacity * 0.9})`;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case "light-leak": {
        const lx = width * (0.2 + Math.sin(localTime * 0.5) * 0.3);
        const ly = height * (0.3 + Math.cos(localTime * 0.4) * 0.2);
        const grad = ctx.createRadialGradient(lx, ly, 10, lx, ly, width * 0.6);
        grad.addColorStop(0, "rgba(251, 146, 60, 0.35)");
        grad.addColorStop(0.4, "rgba(244, 63, 94, 0.2)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case "sparkles": {
        this.particles.forEach((p, idx) => {
          const flash = Math.sin(localTime * 6 + idx * 2);
          if (flash > 0.4) {
            const px = p.x * width;
            const py = p.y * height;
            const s = p.size * 0.4 * (flash - 0.4);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(px - s, py - 1, s * 2, 2);
            ctx.fillRect(px - 1, py - s, 2, s * 2);
          }
        });
        break;
      }

      case "confetti": {
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
        this.particles.forEach((p, idx) => {
          const px = ((p.x + Math.sin(localTime * 2 + idx) * 0.04) % 1 + 1) % 1 * width;
          const py = ((p.y + localTime * 0.2) % 1 + 1) % 1 * height;
          const rot = localTime * 3 + idx;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(rot);
          ctx.fillStyle = colors[idx % colors.length];
          ctx.fillRect(-p.size * 0.2, -p.size * 0.1, p.size * 0.4, p.size * 0.2);
          ctx.restore();
        });
        break;
      }
    }

    ctx.restore();
  }

  private renderTextLayer(
    ctx: CanvasRenderingContext2D,
    layer: TextLayer,
    localTime: number,
    width: number,
    height: number
  ) {
    if (localTime < layer.startTime || localTime > layer.startTime + layer.duration) {
      return;
    }

    const tRel = localTime - layer.startTime;
    const progress = Math.min(1, tRel / Math.max(0.1, layer.duration));
    const entryProgress = Math.min(1, tRel / 0.7); // 0.7s entrance

    ctx.save();

    // Scale font size relative to 1080p target height
    const scaleFactor = height / 1080;
    const scaledFontSize = Math.round(layer.fontSize * scaleFactor);
    const scaledSubFontSize = Math.round(scaledFontSize * 0.52);

    // Compute base position
    let posX = width / 2;
    let posY = height * 0.82;

    switch (layer.position) {
      case "top":
        posY = height * 0.18;
        break;
      case "center":
        posY = height * 0.5;
        break;
      case "bottom":
        posY = height * 0.85;
        break;
      case "lower-third":
        posY = height * 0.78;
        break;
      case "custom":
        posY = (height * (layer.customY ?? 80)) / 100;
        break;
    }

    // Entrance Animation transforms
    let alpha = 1.0;
    let offsetY = 0;
    let scale = 1.0;
    let visibleText = layer.text;

    switch (layer.animation) {
      case "fade-up":
        alpha = entryProgress;
        offsetY = (1 - entryProgress) * 30 * scaleFactor;
        break;

      case "typewriter": {
        const charCount = Math.floor(entryProgress * layer.text.length);
        visibleText = layer.text.slice(0, charCount);
        if (entryProgress < 1.0 && Math.floor(localTime * 4) % 2 === 0) {
          visibleText += " |";
        }
        break;
      }

      case "scale-pop": {
        scale = 0.5 + 0.5 * this.applyEasing(entryProgress, "spring");
        alpha = Math.min(1, entryProgress * 1.5);
        break;
      }

      case "slide-in": {
        const slideX = (1 - this.applyEasing(entryProgress, "ease-out")) * width * 0.25;
        posX += slideX;
        alpha = entryProgress;
        break;
      }

      case "kinetic-bounce": {
        offsetY = Math.sin(entryProgress * Math.PI) * -20 * scaleFactor;
        scale = 0.8 + 0.2 * entryProgress;
        alpha = entryProgress;
        break;
      }

      case "glow-pulse": {
        const pulse = Math.sin(tRel * 4) * 0.3 + 0.7;
        alpha = pulse;
        break;
      }

      case "static":
      default:
        alpha = 1.0;
        break;
    }

    // Exit fade during last 0.4s
    const remainingTime = layer.startTime + layer.duration - localTime;
    if (remainingTime < 0.4) {
      alpha *= Math.max(0, remainingTime / 0.4);
    }

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(posX, posY + offsetY);
    if (scale !== 1.0) ctx.scale(scale, scale);

    // Text formatting
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${scaledFontSize}px '${layer.fontFamily}', sans-serif`;

    // Drop shadow
    if (layer.shadow) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 12 * scaleFactor;
      ctx.shadowOffsetX = 3 * scaleFactor;
      ctx.shadowOffsetY = 4 * scaleFactor;
    }

    // Text Stroke
    if (layer.strokeWidth > 0) {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = layer.strokeWidth * scaleFactor * 2;
      ctx.strokeText(visibleText, 0, 0);
    }

    // Text Fill
    ctx.fillStyle = layer.color;
    ctx.fillText(visibleText, 0, 0);

    // Subtext (Lower-third description)
    if (layer.subtext && entryProgress > 0.3) {
      ctx.shadowColor = "transparent";
      ctx.font = `600 ${scaledSubFontSize}px '${layer.fontFamily}', sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText(layer.subtext, 0, scaledFontSize * 0.9);
    }

    ctx.restore();
  }
}

export const globalRenderEngine = new VideoRenderEngine();
