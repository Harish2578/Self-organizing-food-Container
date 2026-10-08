import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { ruleBasedAnalysis } from "./src/sim/advisor";

dotenv.config({ path: [".env.local", ".env"] });

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// Initialize Gemini lazily so a missing key never crashes the server at load time
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return ai;
}

const hasKey = () => Boolean(process.env.GEMINI_API_KEY) && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

app.get("/api/health", (_req, res) => res.json({ ok: true, gemini: hasKey() }));

app.post("/api/analyze", async (req, res) => {
  try {
    const payload = req.body ?? {};

    if (!hasKey()) {
      return res.json({ result: ruleBasedAnalysis(payload), source: "rule_based" });
    }

    const prompt = `
You are the AI advisor of a self-organizing food storage container. The container senses food condition
(gas, humidity, temperature, camera), moves internal partitions along a guide rail to create separate
micro-environments, and steers fan / vent / valve per chamber. It is compared against a conventional
single-compartment fridge.

Current simulation state (JSON):
${JSON.stringify(payload)}

Task: assess the state and give practical advice for the user. Respond ONLY with valid JSON, no markdown:
{
  "summary": "max 3 sentences comparing the self-organizing container with the conventional fridge",
  "risks": ["up to 3 short risk statements about specific chambers or foods"],
  "recommendations": [
    { "title": "short action", "detail": "one or two sentences", "priority": "High" | "Medium" | "Low" }
  ]
}
Provide exactly 3 recommendations.`;

    const response = await getGemini().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const text = (response.text || "{}").replace(/^```(?:json)?\s*|\s*```$/g, "");
    try {
      res.json({ result: JSON.parse(text), source: "gemini" });
    } catch {
      res.status(502).json({ error: "The model returned a response that was not valid JSON.", raw: text });
    }
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message || "Internal server error during analysis." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
