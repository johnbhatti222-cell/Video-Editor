import {
  ImageClip,
  ProjectSettings,
  AudioTrack,
  ExportProgress,
  ResolutionOption,
  FPSOption,
} from "../types";
import { VideoRenderEngine } from "./renderEngine";
import { AudioEngine } from "./audioEngine";

export class VideoExportRecorder {
  private renderEngine: VideoRenderEngine;
  private isCancelled = false;

  constructor(renderEngine: VideoRenderEngine) {
    this.renderEngine = renderEngine;
  }

  public cancel() {
    this.isCancelled = true;
  }

  public getResolutionDimensions(
    res: ResolutionOption,
    aspect: string
  ): { width: number; height: number } {
    let targetHeight = 1080;
    if (res === "4K") targetHeight = 2160;
    if (res === "720p") targetHeight = 720;

    switch (aspect) {
      case "9:16":
        return { width: Math.round((targetHeight * 9) / 16), height: targetHeight };
      case "1:1":
        return { width: targetHeight, height: targetHeight };
      case "4:5":
        return { width: Math.round((targetHeight * 4) / 5), height: targetHeight };
      case "21:9":
        return { width: Math.round((targetHeight * 21) / 9), height: targetHeight };
      case "16:9":
      default:
        return { width: Math.round((targetHeight * 16) / 9), height: targetHeight };
    }
  }

  public async exportVideo(
    clips: ImageClip[],
    settings: ProjectSettings,
    audioTrack: AudioTrack,
    audioEngine: AudioEngine,
    onProgress: (progress: ExportProgress) => void
  ): Promise<{ blob: Blob; url: string; filename: string }> {
    this.isCancelled = false;

    // Preload all clip assets
    await this.renderEngine.preloadImages(clips);

    const { width, height } = this.getResolutionDimensions(
      settings.exportResolution,
      settings.aspectRatio
    );
    const fps: FPSOption = settings.fps || 30;
    const totalDurationSec = this.renderEngine.getTotalDuration(clips);

    if (totalDurationSec <= 0) {
      throw new Error("No clips or duration to render.");
    }

    const totalFrames = Math.ceil(totalDurationSec * fps);

    // Create high-res offscreen rendering canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true })!;

    // Select supported MIME type
    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8,opus";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/mp4";
    }

    // Capture canvas stream
    const canvasStream = canvas.captureStream(fps);

    // Combine with audio stream if audio enabled
    let combinedStream = canvasStream;
    if (audioTrack.enabled) {
      const audioStream = audioEngine.getMediaStream();
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        const audioTracks = audioStream.getAudioTracks();
        combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioTracks,
        ]);
      }
    }

    // High bitrate for 1080p / 4K HD output (25 Mbps)
    const bitrate = settings.exportResolution === "4K" ? 45000000 : 25000000;

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: bitrate,
      });
    } catch (e) {
      console.warn("MediaRecorder creation with options failed, fallback default:", e);
      mediaRecorder = new MediaRecorder(combinedStream);
    }

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    return new Promise(async (resolve, reject) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, {
          type: mediaRecorder.mimeType || "video/webm",
        });
        const url = URL.createObjectURL(finalBlob);
        const safeTitle = (settings.title || "image_animation")
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "_");
        const ext = settings.exportFormat === "mp4" ? "mp4" : "webm";
        const filename = `${safeTitle}_${settings.exportResolution}_${fps}fps.${ext}`;

        onProgress({
          status: "completed",
          progress: 100,
          currentFrame: totalFrames,
          totalFrames,
          etaSeconds: 0,
          exportedBlob: finalBlob,
          exportedUrl: url,
        });

        resolve({ blob: finalBlob, url, filename });
      };

      mediaRecorder.onerror = (err) => {
        reject(err);
      };

      // Start recording
      mediaRecorder.start(100);

      // Start audio playback synchronized
      if (audioTrack.enabled) {
        audioEngine.play(audioTrack, 0, totalDurationSec);
      }

      const startTimeMs = performance.now();
      const frameDurationSec = 1 / fps;
      const frameIntervalMs = 1000 / fps;

      let frame = 0;

      const renderNextFrame = () => {
        if (this.isCancelled) {
          mediaRecorder.stop();
          audioEngine.stop();
          reject(new Error("Export cancelled by user."));
          return;
        }

        if (frame >= totalFrames) {
          audioEngine.stop();
          mediaRecorder.stop();
          return;
        }

        const currentSec = frame * frameDurationSec;

        // Render frame
        this.renderEngine.render({
          canvas,
          ctx,
          timeSec: currentSec,
          totalDurationSec,
          clips,
          settings,
          width,
          height,
        });

        frame++;

        // Calculate progress and ETA
        const progressPct = Math.round((frame / totalFrames) * 100);
        const elapsedSec = (performance.now() - startTimeMs) / 1000;
        const framesPerSec = frame / Math.max(0.001, elapsedSec);
        const remainingFrames = totalFrames - frame;
        const eta = Math.round(remainingFrames / Math.max(1, framesPerSec));

        onProgress({
          status: "rendering",
          progress: progressPct,
          currentFrame: frame,
          totalFrames,
          etaSeconds: Math.max(0, eta),
        });

        // Maintain frame pacing
        setTimeout(renderNextFrame, frameIntervalMs);
      };

      renderNextFrame();
    });
  }
}
