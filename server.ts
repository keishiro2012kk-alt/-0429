import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Ensure error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Parse PDF for vocabulary
app.post("/api/parse-pdf", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const base64EncodeString = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || "application/pdf";

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64EncodeString
          }
        },
        "Extract all important English learning vocabulary from this document. Respond with a JSON array of objects. Each object should have 'word' (the english word or phrase), 'pos' (part of speech), 'translation' (Japanese translation), and 'example' (an English example sentence), and 'exampleTranslation' (Japanese translation of the example)."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              pos: { type: Type.STRING, description: "Part of speech (e.g. noun, verb, adjective)" },
              translation: { type: Type.STRING },
              example: { type: Type.STRING },
              exampleTranslation: { type: Type.STRING }
            },
            required: ["word", "pos", "translation", "example", "exampleTranslation"]
          }
        }
      }
    });

    try {
      const json = JSON.parse(response.text || "[]");
      res.json(json);
    } catch(e) {
      console.error("JSON Parse Error:", e);
      res.json([]);
    }
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Generate Quiz Questions
app.post("/api/generate-quiz", async (req, res) => {
  const { mode, data, count = 10 } = req.body;

  let prompt = "";
  if (mode === "grammar") {
    // data is a string like "現在完了形"
    prompt = `Create ${count} typing-based English quiz questions focusing on the grammar topic: "${data}". Format as "fill_in_blank". Make questionText the Japanese translation, and subText the English sentence containing (     ) where the answer belongs. User must type the answer. Return a JSON array.`;
  } else {
    // data is an array of words
    const words = data.map((w: any) => w.word).join(", ");
    prompt = `Create ${count} typing-based English quiz questions using these words: ${words}. Mix different types of questions (en->ja, ja->en, fill_in_blank, ordering). User must type the answer. Return a JSON array.`;
  }

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "One of: en_to_ja, ja_to_en, fill_in_blank, ordering, grammar" },
              questionText: { type: Type.STRING, description: "The main text or Japanese translation." },
              subText: { type: Type.STRING, description: "For fill_in_blank, the English sentence with (     ). Optional." },
              correctAnswer: { type: Type.STRING, description: "The exact string the user needs to type" },
              hint: { type: Type.STRING, description: "A small hint keep empty if not needed" },
            },
            required: ["type", "questionText", "correctAnswer"]
          }
        }
      }
    });

    try {
      const json = JSON.parse(response.text || "[]");
      res.json(json);
    } catch(e) {
      res.json([]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chat for Study Advice
app.post("/api/chat", async (req, res) => {
  const { messages, stats } = req.body;
  // stats is summary of user's learning
  
  const systemInstruction = `You are a futuristic, encouraging AI study assistant natively integrated into "LingoAI". 
User stats: ${JSON.stringify(stats)}. 
Provide short, punchy, neon-cyberpunk flavored encouragement and highly actionable study advice directly in Japanese.`;

  try {
    const chat = getAI().chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction }
    });
    
    // Play back history
    if (messages && messages.length > 0) {
      // We don't have direct way to set history smoothly except sending it in a specific way, 
      // but simpler: we just send the conversation as a big prompt, or use multi-turn if easily supported.
      // Easiest is just single prompt with context for now since we're keeping it simple.
      const promptContext = messages.map((m: any) => `${m.role}: ${m.text}`).join("\n");
      const response = await chat.sendMessage({ message: promptContext + "\n\nRespond to the last user message." });
      res.json({ reply: response.text });
    } else {
      res.json({ reply: "データを受信できませんでした。" })
    }
  } catch(error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/grammar-check", async (req, res) => {
  try {
    const { text } = req.body;
    const systemInstruction = `You are a strict but helpful native English teacher. 
The user will give you a sentence. You must correct any grammatical mistakes and make it sound natural.
Explain the corrections in Japanese.`;

    const result = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Check this sentence: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corrected: { type: Type.STRING, description: "The corrected, natural English sentence" },
            explanation: { type: Type.STRING, description: "Detailed explanation in Japanese describing what was requested, why it was wrong, and nuance" },
          },
          required: ["corrected", "explanation"]
        },
        temperature: 0.2
      }
    });

    res.json(JSON.parse(result.text || "{}"));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reading Practice Task
app.post("/api/reading-practice", async (req, res) => {
  try {
    const { words } = req.body;
    const wordList = words.map((w: any) => w.word).join(", ");
    
    // Generate a short reading passage
    const systemInstruction = `You are an English reading comprehension generator. 
Create a short, engaging story or article (about 150-200 words) that naturally includes all of the following English words: ${wordList}.
Also generate 3 reading comprehension questions about the passage.`;

    const result = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a reading passage and 3 comprehension questions, plus their answers.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the passage" },
            passage: { type: Type.STRING, description: "The English passage containing the target words" },
            translation: { type: Type.STRING, description: "The Japanese translation of the entire passage" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "Reading comprehension question in English" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING, description: "The exact correct option from the options array" },
                  explanation: { type: Type.STRING, description: "Explanation of the correct answer in Japanese" }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "passage", "translation", "questions"]
        },
      }
    });

    res.json(JSON.parse(result.text || "{}"));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// General AI Tutor Chat
app.post("/api/general-chat", async (req, res) => {
  try {
    const { messages } = req.body;
    
    const systemInstruction = `You are a friendly, encouraging native English tutor named Lingo.
Your primary role is to help the user practice English conversation or answer their questions about grammar/vocabulary.
If the user asks a question in Japanese, answer in Japanese but provide English examples.
If the user speaks in English, reply in natural, easy-to-understand English.
Correct their English naturally in the conversation if they make obvious mistakes.`;

    const chat = getAI().chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction }
    });
    
    const promptContext = messages.map((m: any) => `${m.role}: ${m.text}`).join("\n");
    const response = await chat.sendMessage({ message: promptContext + "\n\nProvide the next natural response as the AI Tutor." });
    
    res.json({ reply: response.text });
  } catch(error: any) {
    res.status(500).json({ error: error.message });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
