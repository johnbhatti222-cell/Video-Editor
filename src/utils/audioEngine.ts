import { AudioTrack, SynthPreset } from "../types";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private customSourceNode: MediaElementAudioSourceNode | null = null;

  // Polyphony active nodes for clean stop
  private activeOscillators: OscillatorNode[] = [];

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.destinationNode = this.ctx.createMediaStreamDestination();
      
      // Connect to physical speakers AND to media stream destination for recorder
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.destinationNode);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getMediaStream(): MediaStream | null {
    this.initContext();
    return this.destinationNode ? this.destinationNode.stream : null;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = Math.max(0, Math.min(1, vol));
    }
  }

  public play(track: AudioTrack, currentTimeSec: number, totalDurationSec: number) {
    this.initContext();
    if (!this.ctx || !this.masterGain || !track.enabled) return;

    this.stop();
    this.isPlaying = true;
    this.setVolume(track.volume);

    if (track.type === "custom-upload" && track.customAudioUrl) {
      this.playCustomAudio(track.customAudioUrl, currentTimeSec);
    } else {
      this.playSynthPreset(track.synthPreset, currentTimeSec, totalDurationSec, track);
    }
  }

  private playCustomAudio(url: string, startTime: number) {
    if (!this.ctx || !this.masterGain) return;

    if (!this.customAudioElement) {
      this.customAudioElement = new Audio();
      this.customAudioElement.crossOrigin = "anonymous";
      this.customAudioElement.loop = true;
      try {
        this.customSourceNode = this.ctx.createMediaElementSource(this.customAudioElement);
        this.customSourceNode.connect(this.masterGain);
      } catch (e) {
        // Node might already be connected
      }
    }

    if (this.customAudioElement.src !== url) {
      this.customAudioElement.src = url;
    }

    this.customAudioElement.currentTime = startTime;
    this.customAudioElement.play().catch((err) => {
      console.warn("Audio autoplay blocked or failed:", err);
    });
  }

  private playSynthPreset(
    preset: SynthPreset,
    _startTime: number,
    _totalDuration: number,
    track: AudioTrack
  ) {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Harmonic chord progressions (frequencies in Hz)
    let chordProgression: number[][] = [];
    let tempoBpm = 65;
    let waveType: OscillatorType = "sine";

    switch (preset) {
      case "cinematic-ambient":
        // D Minor / F Major deep celestial pad: D3, F3, A3, C4 -> Bb2, D3, F3, A3 -> G2, Bb2, D3, F3 -> A2, C#3, E3, A3
        chordProgression = [
          [146.83, 174.61, 220.0, 261.63, 440.0],
          [116.54, 146.83, 174.61, 220.0, 349.23],
          [98.0, 116.54, 146.83, 174.61, 293.66],
          [110.0, 138.59, 164.81, 220.0, 329.63],
        ];
        tempoBpm = 45;
        waveType = "sine";
        break;

      case "lofi-chill":
        // E Minor 9th warm jazzy Rhodes chords
        chordProgression = [
          [164.81, 196.0, 246.94, 293.66, 370.0], // Em9
          [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
          [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9
          [123.47, 155.56, 185.0, 220.0, 277.18], // B7#9
        ];
        tempoBpm = 75;
        waveType = "triangle";
        break;

      case "epic-orchestral":
        // Epic C minor / Ab / Eb / Bb
        chordProgression = [
          [130.81, 155.56, 196.0, 261.63, 392.0],
          [103.83, 130.81, 155.56, 207.65, 311.13],
          [155.56, 196.0, 233.08, 311.13, 466.16],
          [116.54, 146.83, 174.61, 233.08, 349.23],
        ];
        tempoBpm = 85;
        waveType = "sawtooth";
        break;

      case "retro-wave":
        // A minor Synthwave drive
        chordProgression = [
          [110.0, 130.81, 164.81, 220.0, 329.63],
          [87.31, 110.0, 130.81, 174.61, 261.63],
          [130.81, 164.81, 196.0, 261.63, 392.0],
          [98.0, 123.47, 146.83, 196.0, 293.66],
        ];
        tempoBpm = 110;
        waveType = "sawtooth";
        break;

      case "gentle-piano":
        // C Major 7 -> Am9 -> Fmaj7 -> Gsus4
        chordProgression = [
          [130.81, 164.81, 196.0, 246.94, 329.63],
          [110.0, 130.81, 164.81, 196.0, 261.63],
          [87.31, 110.0, 130.81, 174.61, 220.0],
          [98.0, 130.81, 146.83, 196.0, 293.66],
        ];
        tempoBpm = 60;
        waveType = "triangle";
        break;

      case "uplifting-electronic":
      default:
        // F -> G -> Am -> Em
        chordProgression = [
          [174.61, 220.0, 261.63, 349.23],
          [196.0, 246.94, 293.66, 392.0],
          [220.0, 261.63, 329.63, 440.0],
          [164.81, 196.0, 246.94, 329.63],
        ];
        tempoBpm = 95;
        waveType = "sine";
        break;
    }

    const chordDurationSec = (60 / tempoBpm) * 4; // 4 beats per chord
    let chordIndex = 0;

    const playNextChord = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const chord = chordProgression[chordIndex % chordProgression.length];
      chordIndex++;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(preset === "retro-wave" ? 1800 : 850, ctx.currentTime);
      filter.Q.setValueAtTime(2, ctx.currentTime);
      filter.connect(master);

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const chordGain = ctx.createGain();

        // Slight detune for lush cinematic width
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime((idx - 2) * 7, ctx.currentTime);

        const now = ctx.currentTime;
        chordGain.gain.setValueAtTime(0.001, now);
        
        // Attack
        const attack = preset === "retro-wave" ? 0.05 : 0.8;
        const decay = chordDurationSec - attack - 0.2;
        chordGain.gain.exponentialRampToValueAtTime((0.15 / chord.length) * track.volume, now + attack);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

        osc.connect(chordGain);
        chordGain.connect(filter);

        osc.start(now);
        osc.stop(now + attack + decay + 0.1);

        this.activeOscillators.push(osc);
        osc.onended = () => {
          const index = this.activeOscillators.indexOf(osc);
          if (index !== -1) this.activeOscillators.splice(index, 1);
        };
      });

      // Schedule next chord
      if (this.isPlaying) {
        this.timerId = window.setTimeout(playNextChord, (chordDurationSec - 0.1) * 1000);
      }
    };

    playNextChord();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    // Stop active oscillators
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignored
      }
    });
    this.activeOscillators = [];

    if (this.customAudioElement) {
      this.customAudioElement.pause();
    }
  }

  public seek(track: AudioTrack, timeSec: number, totalDurationSec: number) {
    if (this.isPlaying) {
      this.play(track, timeSec, totalDurationSec);
    }
  }

  public destroy() {
    this.stop();
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement.src = "";
    }
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
  }
}

export const globalAudioEngine = new AudioEngine();
