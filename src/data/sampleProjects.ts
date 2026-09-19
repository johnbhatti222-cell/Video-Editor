import { ImageClip, AudioTrack, ProjectSettings } from "../types";

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  settings: ProjectSettings;
  audioTrack: AudioTrack;
  clips: ImageClip[];
}

// Helper to generate crisp procedural photos with aesthetic nature, cyberpunk, luxury, and landscape graphics
function createProceduralSvgDataUrl(type: "mountain" | "cyberpunk" | "sunset" | "ocean" | "architecture" | "forest"): string {
  let svgContent = "";
  
  if (type === "mountain") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="40%" stop-color="#1e293b" />
          <stop offset="70%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
        <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="100%" stop-color="#f97316" />
        </linearGradient>
        <linearGradient id="m1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="m2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="lake" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#082f49" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#sky)" />
      <circle cx="1350" cy="520" r="140" fill="url(#sun)" opacity="0.9" />
      <circle cx="1350" cy="520" r="260" fill="#fef08a" opacity="0.15" filter="blur(20px)" />
      <!-- Distant peaks -->
      <polygon points="100,750 450,320 800,750" fill="url(#m1)" opacity="0.85" />
      <polygon points="650,750 1000,280 1380,750" fill="url(#m1)" opacity="0.9" />
      <polygon points="1200,750 1550,350 1900,750" fill="url(#m1)" opacity="0.8" />
      <!-- Snowcaps -->
      <polygon points="450,320 380,410 420,440 450,420 480,450 520,400" fill="#f8fafc" opacity="0.95" />
      <polygon points="1000,280 920,380 960,420 1000,390 1040,430 1080,370" fill="#f8fafc" opacity="0.95" />
      <polygon points="1550,350 1480,430 1530,460 1550,440 1610,420" fill="#f8fafc" opacity="0.95" />
      <!-- Midground range -->
      <polygon points="-50,820 280,480 620,820" fill="url(#m2)" />
      <polygon points="420,820 820,420 1250,820" fill="url(#m2)" />
      <polygon points="1050,820 1480,460 1950,820" fill="url(#m2)" />
      <!-- Lake reflection -->
      <rect y="740" width="1920" height="340" fill="url(#lake)" />
      <ellipse cx="1350" cy="850" rx="90" ry="12" fill="#fde047" opacity="0.4" />
      <path d="M0 800 Q 400 790 960 805 T 1920 800 L 1920 1080 L 0 1080 Z" fill="#0c4a6e" opacity="0.4" />
      <!-- Foreground Pine Silhouette -->
      <polygon points="80,1080 120,680 160,1080" fill="#020617" />
      <polygon points="130,1080 170,720 210,1080" fill="#020617" />
      <polygon points="1750,1080 1790,660 1830,1080" fill="#020617" />
      <polygon points="1810,1080 1850,710 1890,1080" fill="#020617" />
    </svg>`;
  } else if (type === "cyberpunk") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="cybersky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#050515" />
          <stop offset="60%" stop-color="#16082f" />
          <stop offset="100%" stop-color="#4a044e" />
        </linearGradient>
        <linearGradient id="grid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ec4899" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.8" />
        </linearGradient>
        <radialGradient id="neonMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#06b6d4" />
          <stop offset="70%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#ec4899" />
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#cybersky)" />
      <!-- Huge Cyber Moon -->
      <circle cx="960" cy="380" r="180" fill="url(#neonMoon)" opacity="0.85" />
      <circle cx="960" cy="380" r="320" fill="#06b6d4" opacity="0.12" filter="blur(30px)" />
      <!-- Skyscrapers Silhouette -->
      <rect x="180" y="320" width="140" height="760" fill="#090514" />
      <rect x="220" y="240" width="60" height="80" fill="#090514" />
      <rect x="360" y="220" width="160" height="860" fill="#06020e" />
      <rect x="560" y="380" width="120" height="700" fill="#0d041c" />
      <rect x="720" y="260" width="180" height="820" fill="#080212" />
      <rect x="1140" y="240" width="190" height="840" fill="#080212" />
      <rect x="1370" y="340" width="130" height="740" fill="#0d041c" />
      <rect x="1540" y="190" width="170" height="890" fill="#06020e" />
      <rect x="1750" y="300" width="140" height="780" fill="#090514" />
      <!-- Cyber Neon Windows & Glow -->
      <g fill="#06b6d4" opacity="0.75">
        <rect x="390" y="280" width="20" height="8" />
        <rect x="390" y="320" width="20" height="8" />
        <rect x="390" y="360" width="20" height="8" />
        <rect x="430" y="260" width="20" height="8" />
        <rect x="430" y="300" width="20" height="8" />
        <rect x="760" y="320" width="30" height="10" fill="#ec4899" />
        <rect x="810" y="360" width="30" height="10" fill="#ec4899" />
        <rect x="1180" y="300" width="30" height="10" fill="#ec4899" />
        <rect x="1230" y="340" width="30" height="10" fill="#38bdf8" />
        <rect x="1580" y="250" width="25" height="10" fill="#a855f7" />
        <rect x="1580" y="290" width="25" height="10" fill="#a855f7" />
        <rect x="1630" y="330" width="25" height="10" fill="#06b6d4" />
      </g>
      <!-- Neon Laser Beams -->
      <line x1="0" y1="620" x2="1920" y2="620" stroke="#ec4899" stroke-width="4" opacity="0.7" />
      <line x1="0" y1="630" x2="1920" y2="630" stroke="#06b6d4" stroke-width="2" opacity="0.8" />
      <!-- Perspective Ground Grid -->
      <rect y="640" width="1920" height="440" fill="#030008" />
      <path d="M 960 640 L 0 1080 M 960 640 L 400 1080 M 960 640 L 800 1080 M 960 640 L 1120 1080 M 960 640 L 1520 1080 M 960 640 L 1920 1080" stroke="#06b6d4" stroke-width="2" opacity="0.4" />
      <line x1="0" y1="680" x2="1920" y2="680" stroke="#ec4899" stroke-width="1.5" opacity="0.3" />
      <line x1="0" y1="740" x2="1920" y2="740" stroke="#ec4899" stroke-width="2" opacity="0.4" />
      <line x1="0" y1="830" x2="1920" y2="830" stroke="#ec4899" stroke-width="2.5" opacity="0.5" />
      <line x1="0" y1="960" x2="1920" y2="960" stroke="#ec4899" stroke-width="3" opacity="0.7" />
    </svg>`;
  } else if (type === "sunset") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#431407" />
          <stop offset="35%" stop-color="#9a3412" />
          <stop offset="65%" stop-color="#ea580c" />
          <stop offset="85%" stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#fef08a" />
        </linearGradient>
        <linearGradient id="sea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#7c2d12" />
          <stop offset="50%" stop-color="#1c1917" />
          <stop offset="100%" stop-color="#0c0a09" />
        </linearGradient>
      </defs>
      <rect width="1920" height="660" fill="url(#sunsetGrad)" />
      <circle cx="960" cy="620" r="140" fill="#fffbeb" opacity="0.95" />
      <circle cx="960" cy="620" r="300" fill="#f59e0b" opacity="0.25" filter="blur(25px)" />
      <rect y="640" width="1920" height="440" fill="url(#sea)" />
      <!-- Sun reflection road -->
      <polygon points="940,640 980,640 1200,1080 720,1080" fill="#fde047" opacity="0.3" filter="blur(6px)" />
      <ellipse cx="960" cy="680" rx="180" ry="8" fill="#fef08a" opacity="0.7" />
      <ellipse cx="960" cy="730" rx="260" ry="12" fill="#fde047" opacity="0.6" />
      <ellipse cx="960" cy="800" rx="340" ry="15" fill="#f59e0b" opacity="0.5" />
      <ellipse cx="960" cy="900" rx="420" ry="20" fill="#ea580c" opacity="0.4" />
      <!-- Palm tree silhouettes -->
      <path d="M 220 1080 Q 280 800 360 480 Q 380 470 390 480 Q 320 800 260 1080 Z" fill="#1c1917" />
      <path d="M 370 480 Q 260 420 140 460" stroke="#1c1917" stroke-width="14" fill="none" stroke-linecap="round" />
      <path d="M 370 480 Q 280 340 180 330" stroke="#1c1917" stroke-width="14" fill="none" stroke-linecap="round" />
      <path d="M 370 480 Q 380 310 390 260" stroke="#1c1917" stroke-width="14" fill="none" stroke-linecap="round" />
      <path d="M 370 480 Q 480 340 560 380" stroke="#1c1917" stroke-width="14" fill="none" stroke-linecap="round" />
      <path d="M 370 480 Q 520 440 600 510" stroke="#1c1917" stroke-width="14" fill="none" stroke-linecap="round" />
      <!-- Birds -->
      <path d="M 680 320 Q 695 310 710 320 Q 725 310 740 320" stroke="#431407" stroke-width="4" fill="none" />
      <path d="M 760 280 Q 772 272 785 280 Q 797 272 810 280" stroke="#431407" stroke-width="3" fill="none" />
    </svg>`;
  } else if (type === "ocean") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="deepocean" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="35%" stop-color="#0369a1" />
          <stop offset="70%" stop-color="#075985" />
          <stop offset="100%" stop-color="#082f49" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#deepocean)" />
      <!-- Light rays -->
      <polygon points="300,-50 500,-50 900,1100 650,1100" fill="#bae6fd" opacity="0.15" />
      <polygon points="800,-50 1050,-50 1450,1100 1200,1100" fill="#bae6fd" opacity="0.2" />
      <polygon points="1300,-50 1500,-50 1850,1100 1650,1100" fill="#bae6fd" opacity="0.12" />
      <!-- Rolling Waves -->
      <path d="M 0 450 Q 480 380 960 450 T 1920 450 L 1920 1080 L 0 1080 Z" fill="#0284c7" opacity="0.35" />
      <path d="M 0 580 Q 480 500 960 580 T 1920 580 L 1920 1080 L 0 1080 Z" fill="#0369a1" opacity="0.5" />
      <path d="M 0 720 Q 480 640 960 720 T 1920 720 L 1920 1080 L 0 1080 Z" fill="#075985" opacity="0.75" />
      <path d="M 0 880 Q 480 800 960 880 T 1920 880 L 1920 1080 L 0 1080 Z" fill="#082f49" />
      <!-- Foam details -->
      <ellipse cx="620" cy="560" rx="140" ry="12" fill="#e0f2fe" opacity="0.4" />
      <ellipse cx="1420" cy="700" rx="180" ry="14" fill="#e0f2fe" opacity="0.4" />
    </svg>`;
  } else if (type === "architecture") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="archsky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#334155" />
        </linearGradient>
        <linearGradient id="concrete" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#e2e8f0" />
          <stop offset="50%" stop-color="#94a3b8" />
          <stop offset="100%" stop-color="#475569" />
        </linearGradient>
        <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.7" />
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.3" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#archsky)" />
      <!-- Modern brutalist geometry -->
      <polygon points="200,1080 700,200 1100,1080" fill="url(#concrete)" />
      <polygon points="700,200 1100,1080 1400,1080 1100,200" fill="#1e293b" opacity="0.8" />
      <polygon points="1100,200 1400,1080 1800,1080 1600,100" fill="url(#concrete)" />
      <!-- Glass panels & reflection -->
      <polygon points="500,450 680,240 920,550 740,760" fill="url(#glass)" />
      <polygon points="1150,300 1500,200 1650,600 1300,700" fill="url(#glass)" />
      <!-- Minimalist shadow line -->
      <line x1="0" y1="920" x2="1920" y2="920" stroke="#f8fafc" stroke-width="3" opacity="0.3" />
    </svg>`;
  } else {
    // Forest
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="forestsky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#064e3b" />
          <stop offset="40%" stop-color="#065f46" />
          <stop offset="80%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#a7f3d0" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#forestsky)" />
      <!-- Fog layers -->
      <ellipse cx="960" cy="650" rx="900" ry="160" fill="#ffffff" opacity="0.25" filter="blur(40px)" />
      <!-- Layer 1 trees -->
      <g fill="#047857" opacity="0.6">
        <polygon points="200,850 250,420 300,850" />
        <polygon points="450,850 500,400 550,850" />
        <polygon points="750,850 800,450 850,850" />
        <polygon points="1100,850 1150,390 1200,850" />
        <polygon points="1400,850 1450,430 1500,850" />
        <polygon points="1700,850 1750,410 1800,850" />
      </g>
      <!-- Layer 2 trees -->
      <g fill="#064e3b" opacity="0.85">
        <polygon points="100,980 160,340 220,980" />
        <polygon points="340,980 400,310 460,980" />
        <polygon points="620,980 690,330 760,980" />
        <polygon points="950,980 1020,300 1090,980" />
        <polygon points="1280,980 1350,320 1420,980" />
        <polygon points="1580,980 1640,340 1700,980" />
      </g>
      <!-- Foreground trees -->
      <g fill="#022c22">
        <polygon points="-20,1080 50,220 120,1080" />
        <polygon points="220,1080 300,180 380,1080" />
        <polygon points="800,1080 880,160 960,1080" />
        <polygon points="1450,1080 1530,190 1610,1080" />
        <polygon points="1820,1080 1900,210 1980,1080" />
      </g>
      <!-- Fireflies/particles -->
      <circle cx="480" cy="620" r="8" fill="#fef08a" opacity="0.9" />
      <circle cx="780" cy="540" r="6" fill="#fef08a" opacity="0.8" />
      <circle cx="1200" cy="680" r="10" fill="#fef08a" opacity="0.95" />
      <circle cx="1600" cy="590" r="7" fill="#fef08a" opacity="0.85" />
    </svg>`;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "wanderlust-cinematic",
    name: "Wanderlust Alpine Journey",
    description: "Dramatic mountain ranges, calm alpine lakes, and pine forests with slow cinematic zoom and warm sunset color grading.",
    thumbnail: createProceduralSvgDataUrl("mountain"),
    settings: {
      title: "Wanderlust Alpine Journey",
      aspectRatio: "16:9",
      letterbox: false,
      fps: 30,
      exportResolution: "1080p",
      exportFormat: "webm",
      loop: true,
    },
    audioTrack: {
      id: "audio-cinematic",
      title: "Cinematic Horizons",
      genre: "Orchestral Ambient",
      type: "builtin-synth",
      synthPreset: "cinematic-ambient",
      volume: 0.85,
      fadeIn: true,
      fadeOut: true,
      enabled: true,
    },
    clips: [
      {
        id: "clip-1",
        name: "Mountain Sunrise",
        imageUrl: createProceduralSvgDataUrl("mountain"),
        duration: 4.0,
        motion: {
          type: "zoom-in",
          intensity: 1.25,
          easing: "ease-in-out",
          focusX: 0.7,
          focusY: 0.45,
        },
        transition: {
          type: "crossfade",
          duration: 1.0,
        },
        filter: "cinematic",
        particleFx: "dust",
        vignette: true,
        filmGrain: 0.15,
        brightness: 5,
        contrast: 10,
        saturation: 15,
        textOverlays: [],
      },
      {
        id: "clip-2",
        name: "Misty Emerald Forest",
        imageUrl: createProceduralSvgDataUrl("forest"),
        duration: 3.8,
        motion: {
          type: "pan-right",
          intensity: 1.2,
          easing: "ease-in-out",
          focusX: 0.5,
          focusY: 0.5,
        },
        transition: {
          type: "zoom-morph",
          duration: 0.9,
        },
        filter: "dreamy",
        particleFx: "bokeh",
        vignette: true,
        filmGrain: 0.1,
        brightness: 0,
        contrast: 5,
        saturation: 20,
        textOverlays: [],
      },
      {
        id: "clip-3",
        name: "Golden Coast Sunset",
        imageUrl: createProceduralSvgDataUrl("sunset"),
        duration: 4.2,
        motion: {
          type: "dolly-slow",
          intensity: 1.3,
          easing: "ease-in-out",
          focusX: 0.5,
          focusY: 0.6,
        },
        transition: {
          type: "film-burn",
          duration: 1.1,
        },
        filter: "warm-sunset",
        particleFx: "light-leak",
        vignette: true,
        filmGrain: 0.2,
        brightness: 8,
        contrast: 12,
        saturation: 25,
        textOverlays: [],
      },
    ],
  },
  {
    id: "cyberpunk-neon-rush",
    name: "Cyberpunk Metropolis 2099",
    description: "High-octane neon night cityscapes with glitch transition, RGB shifts, dynamic pulse, and synthwave soundtrack.",
    thumbnail: createProceduralSvgDataUrl("cyberpunk"),
    settings: {
      title: "Cyberpunk Metropolis 2099",
      aspectRatio: "16:9",
      letterbox: true,
      fps: 60,
      exportResolution: "1080p",
      exportFormat: "webm",
      loop: true,
    },
    audioTrack: {
      id: "audio-synthwave",
      title: "Midnight Overdrive",
      genre: "Cyber Synthwave",
      type: "builtin-synth",
      synthPreset: "retro-wave",
      volume: 0.9,
      fadeIn: true,
      fadeOut: true,
      enabled: true,
    },
    clips: [
      {
        id: "clip-c1",
        name: "Neon Towers",
        imageUrl: createProceduralSvgDataUrl("cyberpunk"),
        duration: 3.5,
        motion: {
          type: "tilt-3d",
          intensity: 1.25,
          easing: "ease-in-out",
          focusX: 0.5,
          focusY: 0.4,
        },
        transition: {
          type: "glitch",
          duration: 0.8,
        },
        filter: "cyberpunk",
        particleFx: "sparkles",
        vignette: true,
        filmGrain: 0.25,
        brightness: 10,
        contrast: 25,
        saturation: 30,
        textOverlays: [],
      },
      {
        id: "clip-c2",
        name: "Modern Monolith",
        imageUrl: createProceduralSvgDataUrl("architecture"),
        duration: 3.2,
        motion: {
          type: "pulse",
          intensity: 1.18,
          easing: "spring",
          focusX: 0.6,
          focusY: 0.3,
        },
        transition: {
          type: "cube-flip",
          duration: 0.9,
        },
        filter: "cyberpunk",
        particleFx: "embers",
        vignette: true,
        filmGrain: 0.2,
        brightness: 5,
        contrast: 20,
        saturation: 25,
        textOverlays: [],
      },
    ],
  },
  {
    id: "ocean-abyss-peace",
    name: "Deep Ocean Serenity",
    description: "Gentle underwater light rays, rolling tidal waves, and tranquil lofi piano atmosphere.",
    thumbnail: createProceduralSvgDataUrl("ocean"),
    settings: {
      title: "Deep Ocean Serenity",
      aspectRatio: "16:9",
      letterbox: false,
      fps: 30,
      exportResolution: "1080p",
      exportFormat: "webm",
      loop: true,
    },
    audioTrack: {
      id: "audio-lofi",
      title: "Ocean Whisper",
      genre: "Lofi Chill & Piano",
      type: "builtin-synth",
      synthPreset: "lofi-chill",
      volume: 0.8,
      fadeIn: true,
      fadeOut: true,
      enabled: true,
    },
    clips: [
      {
        id: "clip-o1",
        name: "Abyssal Light",
        imageUrl: createProceduralSvgDataUrl("ocean"),
        duration: 4.5,
        motion: {
          type: "float-drift",
          intensity: 1.15,
          easing: "ease-in-out",
          focusX: 0.5,
          focusY: 0.5,
        },
        transition: {
          type: "blur-dissolve",
          duration: 1.2,
        },
        filter: "dreamy",
        particleFx: "bokeh",
        vignette: false,
        filmGrain: 0.05,
        brightness: 5,
        contrast: 8,
        saturation: 15,
        textOverlays: [],
      },
      {
        id: "clip-o2",
        name: "Forest Canopy",
        imageUrl: createProceduralSvgDataUrl("forest"),
        duration: 4.0,
        motion: {
          type: "orbit-cw",
          intensity: 1.12,
          easing: "ease-in-out",
          focusX: 0.5,
          focusY: 0.5,
        },
        transition: {
          type: "circle-iris",
          duration: 1.0,
        },
        filter: "cinematic",
        particleFx: "dust",
        vignette: true,
        filmGrain: 0.1,
        brightness: 0,
        contrast: 10,
        saturation: 12,
        textOverlays: [],
      },
    ],
  },
];

export function createBlankProject(): SampleProject {
  return {
    id: `project-${Date.now()}`,
    name: "New Animation Project",
    description: "Custom animated photo sequence",
    thumbnail: createProceduralSvgDataUrl("mountain"),
    settings: {
      title: "New Animation Project",
      aspectRatio: "16:9",
      fps: 30,
      exportResolution: "1080p",
      exportFormat: "webm",
      loop: true,
      letterbox: false,
    },
    audioTrack: {
      id: "audio-default",
      type: "builtin-synth",
      synthPreset: "cinematic-ambient",
      title: "Cinematic Horizons",
      genre: "Orchestral Ambient",
      volume: 0.7,
      fadeIn: true,
      fadeOut: true,
      enabled: true,
    },
    clips: [
      {
        id: "clip-initial",
        name: "Scene 1",
        imageUrl: createProceduralSvgDataUrl("mountain"),
        duration: 4.0,
        motion: {
          type: "zoom-in",
          intensity: 1.15,
          easing: "ease-in-out",
          focusX: 0.5,
          focusY: 0.5,
        },
        transition: {
          type: "crossfade",
          duration: 0.8,
        },
        filter: "none",
        particleFx: "none",
        vignette: true,
        filmGrain: 0.05,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        textOverlays: [],
      },
    ],
  };
}

export { createProceduralSvgDataUrl };
