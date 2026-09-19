import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Intelligent cinematic storyboard fallback engine
function generateIntelligentDirections(theme: string, clipsList: any[], aspectRatio: string = "16:9") {
  const count = Math.max(1, clipsList?.length || 3);
  const lowerTheme = (theme || "").toLowerCase();

  let defaultFilter = "cinematic";
  let defaultParticle = "bokeh";
  let defaultSynth: { synthPreset: string; title: string; genre: string } = {
    synthPreset: "cinematic-ambient",
    title: "Celestial Horizons",
    genre: "Orchestral Ambient",
  };
  let defaultFont = "Cinzel";

  if (lowerTheme.includes("cyber") || lowerTheme.includes("neon") || lowerTheme.includes("2099")) {
    defaultFilter = "cyberpunk";
    defaultParticle = "sparkles";
    defaultSynth = {
      synthPreset: "retro-wave",
      title: "Neon Overdrive 2099",
      genre: "Cyber Synthwave",
    };
    defaultFont = "Space Grotesk";
  } else if (lowerTheme.includes("nostalgic") || lowerTheme.includes("vintage") || lowerTheme.includes("35mm") || lowerTheme.includes("memory")) {
    defaultFilter = "vintage";
    defaultParticle = "dust";
    defaultSynth = {
      synthPreset: "lofi-chill",
      title: "Warm Golden Memories",
      genre: "Lofi Piano & Vinyl",
    };
    defaultFont = "Playfair Display";
  } else if (lowerTheme.includes("luxury") || lowerTheme.includes("brand") || lowerTheme.includes("fashion")) {
    defaultFilter = "warm-sunset";
    defaultParticle = "bokeh";
    defaultSynth = {
      synthPreset: "gentle-piano",
      title: "Opulence in Motion",
      genre: "Modern Classical & Silk",
    };
    defaultFont = "Cinzel";
  } else if (lowerTheme.includes("nature") || lowerTheme.includes("mountain") || lowerTheme.includes("forest") || lowerTheme.includes("odyssey")) {
    defaultFilter = "hdr";
    defaultParticle = "dust";
    defaultSynth = {
      synthPreset: "epic-orchestral",
      title: "Summit of Destiny",
      genre: "Epic Nature Symphony",
    };
    defaultFont = "Cinzel";
  } else if (lowerTheme.includes("social") || lowerTheme.includes("reel") || lowerTheme.includes("short") || lowerTheme.includes("pop")) {
    defaultFilter = "none";
    defaultParticle = "confetti";
    defaultSynth = {
      synthPreset: "uplifting-electronic",
      title: "Pulse Velocity",
      genre: "Uplifting Future Beat",
    };
    defaultFont = "Montserrat";
  }

  const motionCatalog: { type: string; intensity: number; easing: string; fx: number; fy: number }[] = [
    { type: "zoom-in", intensity: 1.25, easing: "ease-in-out", fx: 0.5, fy: 0.45 },
    { type: "pan-right", intensity: 1.2, easing: "ease-in-out", fx: 0.6, fy: 0.5 },
    { type: "dolly-slow", intensity: 1.3, easing: "ease-in-out", fx: 0.5, fy: 0.5 },
    { type: "tilt-3d", intensity: 1.22, easing: "ease-in-out", fx: 0.5, fy: 0.4 },
    { type: "orbit-cw", intensity: 1.15, easing: "ease-in-out", fx: 0.5, fy: 0.5 },
    { type: "float-drift", intensity: 1.18, easing: "ease-in-out", fx: 0.48, fy: 0.52 },
    { type: "pulse", intensity: 1.15, easing: "spring", fx: 0.5, fy: 0.5 },
    { type: "zoom-out", intensity: 1.2, easing: "ease-out", fx: 0.5, fy: 0.5 },
  ];

  const transitionCatalog = [
    "crossfade",
    "zoom-morph",
    "film-burn",
    "blur-dissolve",
    "cube-flip",
    "wipe-right",
    "circle-iris",
  ];

  const particleCatalog = ["bokeh", "dust", "light-leak", "sparkles", "embers", "snow"];

  const poeticTitles = [
    { title: "WHERE JOURNEYS BEGIN", sub: "Moments Captured in Time" },
    { title: "THE UNFOLDING HORIZON", sub: "Chasing Golden Radiance" },
    { title: "WHISPERS OF WONDER", sub: "Echoes Across the Silence" },
    { title: "IN PURSUIT OF LIGHT", sub: "Beyond the Familiar Path" },
    { title: "TIMELESS ELEVATION", sub: "Every Frame a Masterpiece" },
    { title: "INFINITE REFLECTIONS", sub: "A Symphony of Perspectives" },
    { title: "THE FINAL VISTA", sub: "Memories Carved in Eternity" },
  ];

  const directions = (clipsList && clipsList.length > 0 ? clipsList : Array.from({ length: count })).map((clip: any, idx: number) => {
    const motion = motionCatalog[idx % motionCatalog.length];
    const trans = transitionCatalog[idx % transitionCatalog.length];
    const pFx = particleCatalog[idx % particleCatalog.length];
    const textInfo = poeticTitles[idx % poeticTitles.length];
    const clipName = clip?.name ? clip.name.toUpperCase() : textInfo.title;

    return {
      sceneIndex: idx,
      motionType: motion.type,
      intensity: motion.intensity,
      easing: motion.easing,
      focusX: motion.fx,
      focusY: motion.fy,
      transitionType: idx === count - 1 ? "crossfade" : trans,
      transitionDuration: 0.8 + (idx % 3) * 0.2,
      duration: 3.8 + (idx % 2) * 0.4,
      filter: defaultFilter,
      particleFx: defaultParticle !== "none" ? pFx : "none",
      titleText: clipName,
      subtitleText: textInfo.sub,
      fontFamily: defaultFont,
      directorNotes: `Curated motion trajectory creating dramatic cinematic rhythm for scene ${idx + 1}.`,
    };
  });

  return {
    directions,
    recommendedAudio: defaultSynth,
  };
}

// AI Direct Motion & Storyboard
app.post("/api/ai/direct-motion", async (req, res) => {
  const { clips = [], theme = "Epic Cinematic Story", aspectRatio = "16:9", customPrompt } = req.body;
  const count = Math.max(1, clips.length || req.body.count || 3);

  try {
    const ai = getAI();

    const systemPrompt = `You are a master cinematic film director and video editor specializing in turning static photos into high-emotion, cinematic animated videos.
Given a list of photo scenes, a theme ("${theme}"), and aspect ratio ("${aspectRatio}"), choreograph creative Ken Burns camera motions, easing curves, transition effects, cinematic color grades, particle overlays, and animated lower-third captions for each scene.`;

    const clipNames = clips.map((c: any, i: number) => `Scene ${i + 1}: "${c.name || `Photo ${i + 1}`}" (Current Motion: ${c.currentMotion || "zoom-in"})`).join("\n");
    const prompt = `Theme: ${theme}
Aspect Ratio: ${aspectRatio}
Number of Scenes: ${count}
${customPrompt ? `User Vision: ${customPrompt}` : ""}

Scenes:
${clipNames || `Generate choreography for ${count} sequential scenes.`}

Generate realistic, high-impact motion parameters and sound atmosphere.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Suggested project title" },
            recommendedAudio: {
              type: Type.OBJECT,
              properties: {
                synthPreset: {
                  type: Type.STRING,
                  description: "One of: cinematic-ambient, lofi-chill, epic-orchestral, uplifting-electronic, gentle-piano, retro-wave",
                },
                title: { type: Type.STRING },
                genre: { type: Type.STRING },
              },
              required: ["synthPreset", "title", "genre"],
            },
            directions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneIndex: { type: Type.INTEGER },
                  motionType: {
                    type: Type.STRING,
                    description: "One of: zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down, orbit-cw, orbit-ccw, tilt-3d, dolly-slow, float-drift, pulse, dynamic-shake",
                  },
                  intensity: { type: Type.NUMBER, description: "Float between 0.8 and 1.8" },
                  easing: { type: Type.STRING, description: "One of: ease-in-out, linear, ease-out, ease-in, spring" },
                  focusX: { type: Type.NUMBER, description: "0.0 to 1.0" },
                  focusY: { type: Type.NUMBER, description: "0.0 to 1.0" },
                  transitionType: {
                    type: Type.STRING,
                    description: "One of: none, crossfade, wipe-left, wipe-right, wipe-up, wipe-down, zoom-morph, push-left, push-right, push-up, glitch, film-burn, blur-dissolve, circle-iris, cube-flip, diamond-wipe",
                  },
                  transitionDuration: { type: Type.NUMBER, description: "Duration in seconds (0.5 to 1.5)" },
                  duration: { type: Type.NUMBER, description: "Scene duration in seconds (3.0 to 6.0)" },
                  filter: {
                    type: Type.STRING,
                    description: "One of: none, cinematic, vintage, cyberpunk, noir, warm-sunset, dreamy, hdr, vhs, sepia",
                  },
                  particleFx: {
                    type: Type.STRING,
                    description: "One of: none, bokeh, dust, rain, snow, embers, light-leak, sparkles, confetti",
                  },
                  titleText: { type: Type.STRING, description: "Punchy, poetic all-caps title (2-5 words)" },
                  subtitleText: { type: Type.STRING, description: "Cinematic subtitle (3-8 words)" },
                  fontFamily: { type: Type.STRING, description: "One of: Cinzel, Playfair Display, Space Grotesk, Montserrat, Plus Jakarta Sans, Inter" },
                  directorNotes: { type: Type.STRING, description: "Creative reasoning" },
                },
                required: ["sceneIndex", "motionType", "transitionType", "duration", "filter", "particleFx", "titleText"],
              },
            },
          },
          required: ["title", "recommendedAudio", "directions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.directions && Array.isArray(parsed.directions) && parsed.directions.length > 0) {
      res.json({
        success: true,
        directions: parsed.directions,
        recommendedAudio: parsed.recommendedAudio,
        title: parsed.title,
        source: "gemini-3.8-flash",
      });
      return;
    }

    const fallback = generateIntelligentDirections(theme, clips, aspectRatio);
    res.json({
      success: true,
      directions: fallback.directions,
      recommendedAudio: fallback.recommendedAudio,
      source: "intelligent-director",
    });
  } catch (error: any) {
    // Graceful intelligent fallback when Gemini quota/rate limits or network conditions occur
    const fallback = generateIntelligentDirections(theme, clips, aspectRatio);
    res.json({
      success: true,
      directions: fallback.directions,
      recommendedAudio: fallback.recommendedAudio,
      source: "intelligent-director",
      note: "Directed using built-in intelligent cinematic choreography engine.",
    });
  }
});

// AI Caption & Storyteller
app.post("/api/ai/generate-captions", async (req, res) => {
  const { count = 3, style = "inspirational, emotional, aesthetic", prompt: userPrompt } = req.body;

  try {
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate ${count} sequential cinematic subtitle lines for an image-to-video slideshow.
Style/Mood: ${style}
Context: ${userPrompt || "A journey through memorable moments"}.
Keep each caption punchy, poetic, and between 4 to 10 words.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  subtext: { type: Type.STRING },
                },
                required: ["text"],
              },
            },
          },
          required: ["captions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.captions && Array.isArray(parsed.captions)) {
      res.json({ success: true, captions: parsed.captions, source: "gemini-3.8-flash" });
      return;
    }

    throw new Error("Invalid captions format");
  } catch (_error: any) {
    const fallbackCaptions = [
      { text: "INTO THE GOLDEN DAWN", subtext: "Where every journey finds its beginning" },
      { text: "WHISPERS ACROSS TIME", subtext: "Preserving every fleeting heartbeat" },
      { text: "BEYOND THE HORIZON", subtext: "The path illuminated by dreams" },
      { text: "ETERNAL RESILIENCE", subtext: "Standing tall amidst the shifting winds" },
      { text: "A MASTERPIECE IN MOTION", subtext: "Cherishing what words cannot speak" },
    ].slice(0, count);

    res.json({ success: true, captions: fallbackCaptions, source: "intelligent-fallback" });
  }
});

// Mount Vite in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
